//contexts/UserDataContext.js//

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
const initialSavedItems = { stories: [], themes: [] };

const UserDataContext = createContext({
  user: null,
  loading: true,
  darkMode: false,
  favorites: initialFavorites,
  lastVisited: initialVisited,
  favoriteItems: initialFavoriteItems,
  savedItems: initialSavedItems,
  savedLoading: false,
  savedUpdatesCount: 0,
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
  const [savedItems, setSavedItems] = useState(initialSavedItems);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedUpdatesCount, setSavedUpdatesCount] = useState(0);
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
          setSavedItems(initialSavedItems);
          setSavedUpdatesCount(0);
          setSavedLoading(false);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      if (!cancelled) {
        setSavedLoading(true);
        setSavedItems(initialSavedItems);
        setSavedUpdatesCount(0);
      }
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

  useEffect(() => {
    let cancelled = false;

    const fetchSavedItems = async () => {
      if (!user) {
        if (!cancelled) {
          setSavedItems(initialSavedItems);
          setSavedUpdatesCount(0);
          setSavedLoading(false);
        }
        return;
      }

      setSavedLoading(true);

      const storyIds = favorites?.stories || [];
      const themeIds = favorites?.themes || [];
      const storyMap = favoriteItems?.stories || {};
      const themeMap = favoriteItems?.themes || {};

      const buildLocalList = (ids, map, kind) =>
        ids
          .map((id) => map[id])
          .filter(Boolean)
          .map((item) => ({
            ...item,
            id: item.id || item.docId || id,
            _kind: kind,
          }));

      const localStories = buildLocalList(storyIds, storyMap, "story");
      const localThemes = buildLocalList(themeIds, themeMap, "theme");

      const needsStoryDocs = storyIds.filter((id) => {
        const item = storyMap[id];
        return !item || !Array.isArray(item.timeline);
      });
      const needsThemeDocs = themeIds.filter((id) => {
        const item = themeMap[id];
        return !item || !Array.isArray(item.timeline);
      });

      const fetchDocs = async (ids, collectionName, kind) => {
        const docs = await Promise.all(
          ids.map(async (id) => {
            try {
              const ref = doc(db, collectionName, id);
              const snap = await getDoc(ref);
              if (!snap.exists()) return null;
              const data = snap.data() || {};
              return { id, docId: data.docId || id, ...data, _kind: kind };
            } catch (err) {
              console.warn(`Failed to load saved ${kind} ${id}`, err);
              return null;
            }
          })
        );
        return docs.filter(Boolean);
      };

      try {
        const [fetchedStories, fetchedThemes] = await Promise.all([
          fetchDocs(needsStoryDocs, "stories", "story"),
          fetchDocs(needsThemeDocs, "themes", "theme"),
        ]);

        const orderItems = (ids, remote, local) =>
          ids
            .map((id) => {
              const fromRemote = remote.find((item) => item.id === id);
              const fromLocal = local.find((item) => item.id === id);
              return fromRemote || fromLocal || null;
            })
            .filter(Boolean);

        const mergedStories = orderItems(storyIds, fetchedStories, localStories);
        const mergedThemes = orderItems(themeIds, fetchedThemes, localThemes);

        if (!cancelled) {
          setSavedItems({
            stories: mergedStories,
            themes: mergedThemes,
          });
        }
      } catch (err) {
        console.warn("Failed to load saved items", err);
        if (!cancelled) {
          setSavedItems({
            stories: localStories,
            themes: localThemes,
          });
        }
      } finally {
        if (!cancelled) setSavedLoading(false);
      }
    };

    fetchSavedItems();

    return () => {
      cancelled = true;
    };
  }, [user, favorites, favoriteItems]);

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

      return count;
    },
    [lastVisited]
  );

  useEffect(() => {
    if (!user) {
      setSavedUpdatesCount(0);
      return;
    }
    const allSavedItems = [
      ...(savedItems?.stories || []),
      ...(savedItems?.themes || []),
    ];
    const totalUpdates = allSavedItems.reduce((sum, item) => {
      const type = item?._kind === "theme" ? "themes" : "stories";
      return sum + getUpdatesSinceLastVisit(type, item);
    }, 0);
    setSavedUpdatesCount(totalUpdates);
  }, [savedItems, getUpdatesSinceLastVisit, user]);

  const themeColors = getThemeColors(darkMode);

  const value = {
    user,
    loading,
    darkMode,
    favorites,
    lastVisited,
    favoriteItems,
    savedItems,
    savedLoading,
    savedUpdatesCount,
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
