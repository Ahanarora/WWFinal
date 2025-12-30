// ----------------------------------------
// screens/ThemesScreen.js
// Clean version using WWFilterPaneThemes
// ----------------------------------------

import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { db } from "../utils/firebase";
import { scoreContent } from "../utils/ranking";
import { getThemeColors } from "../styles/theme";
import { checkOnline } from "../utils/network";

import WWThemeCard from "../components/WWThemeCard";
import WWCompactCard from "../components/WWCompactCard";
import WWFilterPaneThemes from "../components/WWFilterPaneThemes";
import WWHeader from "../components/WWHeader";

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
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState("All");
  const [sortMode, setSortMode] = useState("relevance");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filterVisible, setFilterVisible] = useState(true);

  const palette = getThemeColors(false);
  const styles = useMemo(() => createStyles(palette), [palette]);

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
  const fetchThemes = useCallback(async () => {
    const timeout = setTimeout(() => {
      setLoading(false);
      setError("This is taking longer than expected.");
    }, 15000);

    try {
      setError(null);
      setLoading(true);

      const online = await checkOnline();
      if (!online) {
        setError("You’re offline. Please check your connection.");
        return;
      }

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
      setError("Something went wrong. Please try again.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

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
  let content = null;

  if (loading) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.accent} />
        <Text style={styles.loadingText}>Loading themes...</Text>
      </View>
    );
  } else if (error) {
    content = (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchThemes}>
          <Text style={styles.retry}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (sortedThemes.length === 0) {
    content = (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Nothing here yet</Text>
        <Text style={styles.emptySubtitle}>
          Check back later — we update this regularly.
        </Text>
      </View>
    );
  } else {
    content = (
      <View style={styles.container}>
        {filterVisible && (
          <>
            <WWFilterPaneThemes
              categories={CATEGORIES}
              activeCategory={activeCategory}
              themeColors={palette}
              onCategoryChange={setActiveCategory}
            />
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
          </>
        )}
      <FlatList
        data={sortedThemes}
        keyExtractor={(item) => item.docId || item.id}
        renderItem={renderThemeCard}
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

  return (
    <View style={{ flex: 1 }}>
      <WWHeader />
      {content}
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
    errorText: {
      fontSize: 15,
      color: palette.textPrimary,
      textAlign: "center",
    },
    retry: {
      marginTop: 12,
      color: "#2563EB",
      fontWeight: "600",
    },
    loadingText: { marginTop: 8, color: palette.textSecondary },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 6,
      color: palette.textPrimary,
    },
    emptySubtitle: {
      fontSize: 14,
      color: palette.textSecondary,
      textAlign: "center",
    },
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
