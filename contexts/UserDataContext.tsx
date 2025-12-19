// ----------------------------------------
// contexts/UserDataContext.tsx
// Phase 2B — Explicitly typed React context
// ----------------------------------------

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getThemeColors } from "../styles/theme";

// ----------------------------------------
// Types
// ----------------------------------------

type ItemKind = "stories" | "themes";

type TimelineLikeEvent = {
  date?: string | number;
};

type FeedItem = {
  id: string;
  timeline?: TimelineLikeEvent[];
};

type UserDataContextType = {
  user: any;
  loading: boolean;
  darkMode: boolean;

  favorites: {
    stories: string[];
    themes: string[];
  };

  lastVisited: {
    stories: Record<string, number>;
    themes: Record<string, number>;
  };

  favoriteItems: {
    stories: Record<string, FeedItem>;
    themes: Record<string, FeedItem>;
  };

  savedItems: {
    stories: FeedItem[];
    themes: FeedItem[];
  };

  savedLoading: boolean;
  savedUpdatesCount: number;

  themeColors: ReturnType<typeof getThemeColors>;

  toggleDarkMode: () => void;
  toggleFavorite: (type: ItemKind, id: string, itemData?: FeedItem) => void;
  recordVisit: (type: ItemKind, id: string) => void;
  getUpdatesSinceLastVisit: (type: ItemKind, item: FeedItem) => number;
};

// ----------------------------------------
// Initial values
// ----------------------------------------

const initialFavorites = { stories: [], themes: [] };
const initialVisited = { stories: {}, themes: {} };
const initialFavoriteItems = { stories: {}, themes: {} };
const initialSavedItems = { stories: [], themes: [] };

// ----------------------------------------
// Context
// ----------------------------------------

const UserDataContext = createContext<UserDataContextType>({
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

type FirestoreTimestampLike = {
  seconds: number;
  toDate: () => Date;
};

function isFirestoreTimestamp(
  value: unknown
): value is FirestoreTimestampLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as any).toDate === "function"
  );
}


// ----------------------------------------
// Helpers
// ----------------------------------------


const timestampToMs = (
  value?: string | number | Date | FirestoreTimestampLike
): number => {
  if (!value) return 0;

  // Firestore Timestamp
  if (isFirestoreTimestamp(value)) {
    return value.toDate().getTime();
  }

  // JS Date
  if (value instanceof Date) {
    return value.getTime();
  }

  // string | number
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

// ----------------------------------------
// Provider
// ----------------------------------------

export function UserDataProvider({
  user,
  children,
}: {
  user: any;
  children: ReactNode;
}) {
  const [darkMode, setDarkMode] = useState(false);
  const [favorites, setFavorites] = useState(initialFavorites);
  const [lastVisited, setLastVisited] = useState(initialVisited);
  const [favoriteItems, setFavoriteItems] = useState(initialFavoriteItems);
  const [savedItems, setSavedItems] = useState(initialSavedItems);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedUpdatesCount, setSavedUpdatesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------
  // Load user doc
  // ----------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadUserDoc(currentUser: any) {
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
      setSavedLoading(true);

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

  // ----------------------------------------
  // Persistence helper
  // ----------------------------------------

  const persist = async (payload: Partial<Record<string, unknown>>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), payload, { merge: true });
    } catch (err) {
      console.warn("Failed to persist user data", err);
    }
  };

  // ----------------------------------------
  // Actions
  // ----------------------------------------

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      persist({ darkMode: next });
      return next;
    });
  }, [user]);

  const toggleFavorite = useCallback(
    (type: ItemKind, id: string, itemData?: FeedItem) => {
      if (!user || !type || !id) return;

      setFavorites((prev) => {
        const current = prev[type] || [];
        const exists = current.includes(id);
        const updated = exists
          ? current.filter((x) => x !== id)
          : [...current, id];

        const nextFavorites = { ...prev, [type]: updated };

        setFavoriteItems((prevItems) => {
          const items = { ...(prevItems[type] || {}) };
          if (exists) delete items[id];
          else if (itemData) {
            items[id] = {
              ...itemData,
              id,
              _kind: type === "themes" ? "theme" : "story",
            } as FeedItem;
          }
          const combined = { ...prevItems, [type]: items };
          persist({ favorites: nextFavorites, favoriteItems: combined });
          return combined;
        });

        return nextFavorites;
      });
    },
    [user]
  );

  const recordVisit = useCallback(
    (type: ItemKind, id: string) => {
      if (!user || !type || !id) return;
      setLastVisited((prev) => {
        const next = {
          ...prev,
          [type]: { ...(prev[type] || {}), [id]: Date.now() },
        };
        persist({ lastVisited: next });
        return next;
      });
    },
    [user]
  );

  const getUpdatesSinceLastVisit = useCallback(
    (type: ItemKind, item: FeedItem) => {
      if (!item?.id) return 0;
      const last = lastVisited[type]?.[item.id];
      if (!last) return 0;

      let count = 0;
      (item.timeline || []).forEach((ev) => {
        if (timestampToMs(ev?.date) > last) count += 1;
      });
      return count;
    },
    [lastVisited]
  );

  // ----------------------------------------
  // Context value
  // ----------------------------------------

  const value: UserDataContextType = {
    user,
    loading,
    darkMode,
    favorites,
    lastVisited,
    favoriteItems,
    savedItems,
    savedLoading,
    savedUpdatesCount,
    themeColors: getThemeColors(darkMode),
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

// ----------------------------------------
// Hook
// ----------------------------------------

export function useUserData() {
  return useContext(UserDataContext);
}
