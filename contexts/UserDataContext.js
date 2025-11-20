import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getThemeColors } from "../styles/theme";

const initialFavorites = { stories: [], themes: [] };
const initialVisited = { stories: {}, themes: {} };
const initialFavoriteItems = { stories: {}, themes: {} };

const UserDataContext = createContext({
  user: null,
  loading: true,
  darkMode: false,
  favorites: initialFavorites,
  lastVisited: initialVisited,
  favoriteItems: initialFavoriteItems,
  themeColors: getThemeColors(false),
  toggleDarkMode: () => {},
  toggleFavorite: () => {},
  recordVisit: () => {},
  getUpdatesSinceLastVisit: () => 0,
});

const timestampToMs = (value) => {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value.seconds) return value.seconds * 1000;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

export function UserDataProvider({ user, children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [favorites, setFavorites] = useState(initialFavorites);
  const [lastVisited, setLastVisited] = useState(initialVisited);
  const [favoriteItems, setFavoriteItems] = useState(initialFavoriteItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUserDoc(currentUser) {
      if (!currentUser) {
        if (!cancelled) {
          setDarkMode(false);
          setFavorites(initialFavorites);
          setLastVisited(initialVisited);
          setFavoriteItems(initialFavoriteItems);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);
        if (!cancelled) {
          if (snap.exists()) {
            const data = snap.data() || {};
            setDarkMode(!!data.darkMode);
            setFavorites({
              stories: data.favorites?.stories || [],
              themes: data.favorites?.themes || [],
            });
            setLastVisited({
              stories: data.lastVisited?.stories || {},
              themes: data.lastVisited?.themes || {},
            });
            setFavoriteItems({
              stories: data.favoriteItems?.stories || {},
              themes: data.favoriteItems?.themes || {},
            });
          } else {
            await setDoc(ref, {
              darkMode: false,
              favorites: initialFavorites,
              lastVisited: initialVisited,
              favoriteItems: initialFavoriteItems,
            });
            if (!cancelled) {
              setDarkMode(false);
              setFavorites(initialFavorites);
              setLastVisited(initialVisited);
              setFavoriteItems(initialFavoriteItems);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load user preferences", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUserDoc(user);
    return () => {
      cancelled = true;
    };
  }, [user]);

  const persist = async (payload) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), payload, { merge: true });
    } catch (err) {
      console.warn("Failed to persist user data", err);
    }
  };

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      persist({ darkMode: next });
      return next;
    });
  }, [user]);

  const toggleFavorite = useCallback(
    (type, id, itemData) => {
      if (!user || !type || !id) return;
      setFavorites((prev) => {
        const current = prev[type] || [];
        const exists = current.includes(id);
        const updatedList = exists
          ? current.filter((itemId) => itemId !== id)
          : [...current, id];
        const nextFavorites = { ...prev, [type]: updatedList };
        setFavoriteItems((prevItems) => {
          const currentItems = prevItems[type] || {};
          const nextItems = { ...currentItems };
          if (exists) {
            delete nextItems[id];
          } else if (itemData) {
            nextItems[id] = {
              id,
              title: itemData.title,
              overview: itemData.overview,
              imageUrl: itemData.imageUrl,
              category: itemData.category,
              _kind: type === "stories" ? "story" : "theme",
            };
          }
          const combined = { ...prevItems, [type]: nextItems };
          persist({ favorites: nextFavorites, favoriteItems: combined });
          return combined;
        });
        return nextFavorites;
      });
    },
    [user]
  );

  const recordVisit = useCallback(
    (type, id) => {
      if (!user || !type || !id) return;
      setLastVisited((prev) => {
        const nextForType = {
          ...(prev[type] || {}),
          [id]: Date.now(),
        };
        const next = { ...prev, [type]: nextForType };
        persist({ lastVisited: next });
        return next;
      });
    },
    [user]
  );

  const getUpdatesSinceLastVisit = useCallback(
    (type, item) => {
      if (!item?.id) return 0;
      const last = lastVisited[type]?.[item.id];
      if (!last) return 0;

      let count = 0;
      const timeline = Array.isArray(item.timeline) ? item.timeline : [];
      timeline.forEach((event) => {
        const dateMs = timestampToMs(event?.date);
        if (dateMs > last) count += 1;
      });

      if (count > 0) return count;

      const updatedAtMs = timestampToMs(item.updatedAt);
      return updatedAtMs > last ? 1 : 0;
    },
    [lastVisited]
  );

  const themeColors = getThemeColors(darkMode);

  const value = {
    user,
    loading,
    darkMode,
    favorites,
    lastVisited,
    favoriteItems,
    themeColors,
    toggleDarkMode,
    toggleFavorite,
    recordVisit,
    getUpdatesSinceLastVisit,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  return useContext(UserDataContext);
}
