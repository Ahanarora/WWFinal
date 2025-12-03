// ----------------------------------------
// screens/ThemesScreen.js
// Clean version using WWFilterPaneThemes
// ----------------------------------------

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { scoreContent } from "../utils/ranking";
import { getThemeColors } from "../styles/theme";

import WWThemeCard from "../components/WWThemeCard";
import WWCompactCard from "../components/WWCompactCard";
import WWFilterPaneThemes from "../components/WWFilterPaneThemes";

// -------------------------------
// CATEGORY DEFINITIONS
// -------------------------------
const CATEGORIES = ["All", "Politics", "Business & Economy", "World", "India"];

// -------------------------------
// SAFE TIMESTAMP HELPERS
// -------------------------------
const safeTimestamp = (item) => {
  if (!item) return 0;
  const t = item.updatedAt || item.publishedAt || item.createdAt;
  if (!t) return 0;

  if (typeof t.toDate === "function") return t.toDate().getTime();
  if (t.seconds) return t.seconds * 1000;

  const d = new Date(t);
  return isNaN(d) ? 0 : d.getTime();
};

const getCreatedAtMs = (item) => {
  const t = item.createdAt;
  if (!t) return 0;

  if (typeof t.toDate === "function") return t.toDate().getTime();
  if (t.seconds) return t.seconds * 1000;

  const d = new Date(t);
  return isNaN(d) ? 0 : d.getTime();
};

// -------------------------------
// MAIN COMPONENT
// -------------------------------
export default function ThemesScreen({ navigation }) {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("All");
  const [sortMode, setSortMode] = useState("relevance");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filterVisible, setFilterVisible] = useState(true);

  const palette = getThemeColors(false);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const headerShownRef = useRef(true);
  const lastOffsetY = useRef(0);
  const filterVisibleRef = useRef(true);

  const toggleHeader = useCallback(
    (show) => {
      if (!navigation?.getParent) return;
      if (headerShownRef.current === show) return;
      navigation.getParent()?.setOptions({ headerShown: show });
      headerShownRef.current = show;
    },
    [navigation]
  );

  const handleHeaderScroll = useCallback(
    ({ nativeEvent }) => {
      const y = nativeEvent?.contentOffset?.y || 0;
      const delta = y - lastOffsetY.current;
      const threshold = 20;
      if (delta > threshold) {
        toggleHeader(false);
        if (filterVisibleRef.current) {
          filterVisibleRef.current = false;
          setFilterVisible(false);
        }
      } else if (delta < -threshold) {
        toggleHeader(true);
        if (!filterVisibleRef.current) {
          filterVisibleRef.current = true;
          setFilterVisible(true);
        }
      }
      lastOffsetY.current = y;
    },
    [toggleHeader]
  );

  useEffect(
    () => () => {
      toggleHeader(true);
      filterVisibleRef.current = true;
      setFilterVisible(true);
    },
    [toggleHeader]
  );

  // -------------------------------
  // FETCH THEMES
  // -------------------------------
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const snapshot = await getDocs(collection(db, "themes"));
        const data = snapshot.docs.map((doc) => {
          const raw = doc.data() || {};
          return {
            docId: doc.id,
            type: "theme",
            ...raw,
            cardPreview:
              raw.cardDescription ||
              raw.card_description ||
              raw.cardPreview ||
              raw.card_preview ||
              raw.preview ||
              raw.summary ||
              raw.overview ||
              null,
          };
        });
        setThemes(data);
      } catch (err) {
        console.error("Error loading themes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchThemes();
  }, []);

  // -------------------------------
  // FILTER + SORT
  // -------------------------------
  const matchesCategory = (item, category) => {
    if (category === "All") return true;

    const allCats = Array.isArray(item.allCategories)
      ? item.allCategories
      : item.category
      ? [item.category]
      : [];

    return allCats
      .map((c) => (c || "").toLowerCase())
      .includes(category.toLowerCase());
  };

  const filteredThemes = useMemo(
    () => themes.filter((t) => matchesCategory(t, activeCategory)),
    [themes, activeCategory]
  );

  const sortedThemes = useMemo(() => {
    const list = [...filteredThemes];

    if (sortMode === "updated") {
      return list.sort((a, b) => safeTimestamp(b) - safeTimestamp(a));
    }
    if (sortMode === "published") {
      return list.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
    }

    return list.sort((a, b) => scoreContent(b) - scoreContent(a));
  }, [filteredThemes, sortMode]);

  // -------------------------------
  // RENDER THEME CARD
  // -------------------------------
  const renderThemeCard = ({ item }) => {
    if (item.isCompactCard) {
      return <WWCompactCard item={item} navigation={navigation} />;
    }

    return <WWThemeCard item={item} navigation={navigation} />;
  };

  // -------------------------------
  // LOADING STATES
  // -------------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading themes...</Text>
      </View>
    );
  }

  if (sortedThemes.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No themes found.</Text>
      </View>
    );
  }

  // -------------------------------
  // MAIN UI
  // -------------------------------
  return (
    <View style={styles.container}>
      {/* PINNED FILTER PANE */}
      {filterVisible && (
        <WWFilterPaneThemes
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      )}
      <View style={styles.sortBar}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortMenu(true)}
        >
          <Ionicons
            name="swap-vertical-outline"
            size={16}
            color={palette.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.sortButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {/* THEMES LIST */}
      <FlatList
        data={sortedThemes}
        keyExtractor={(item) => item.docId || item.id}
        renderItem={renderThemeCard}
        onScroll={handleHeaderScroll}
        scrollEventThrottle={32}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      <Modal
        visible={showSortMenu}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSortMenu(false)}
      >
        <TouchableOpacity
          style={styles.sortModalBackdrop}
          onPress={() => setShowSortMenu(false)}
        >
          <View style={styles.sortModalContent}>
            {[
              { key: "relevance", label: "Relevance" },
              { key: "updated", label: "Recently Updated" },
              { key: "published", label: "Recently Published" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.sortModalOption}
                onPress={() => {
                  setSortMode(opt.key);
                  setShowSortMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.sortModalOptionText,
                    sortMode === opt.key && styles.sortSelectedOptionText,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ----------------------------------------
// STYLES
// ----------------------------------------
const createStyles = (palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    sortBar: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    sortButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    sortButtonText: {
      fontSize: 14,
      color: palette.textSecondary,
      fontWeight: "500",
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: { marginTop: 8, color: palette.textSecondary },
    emptyText: { fontSize: 16, color: palette.textSecondary },
    sortModalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
      padding: 30,
    },
    sortModalContent: {
      backgroundColor: palette.surface,
      borderRadius: 10,
      overflow: "hidden",
    },
    sortModalOption: {
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    sortModalOptionText: {
      fontSize: 16,
      color: palette.textPrimary,
    },
    sortSelectedOptionText: {
      fontWeight: "bold",
      color: palette.accent,
    },
  });
