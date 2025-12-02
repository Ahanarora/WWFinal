// ----------------------------------------
// screens/HomeScreen.js
// Category → Featured Stories → Featured Themes → Regular Combined Feed
// Using WWHomeCard + WWCompactCard
// ----------------------------------------

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { scoreContent } from "../utils/ranking";
import { getThemeColors } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { useUserData } from "../contexts/UserDataContext";
import { setStorySearchCache } from "../utils/storyCache";

import WWHomeCard from "../components/WWHomeCard";
import WWCompactCard from "../components/WWCompactCard";

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
// CATEGORY + SUBCATEGORY DEFINITIONS
// -------------------------------
const CATEGORIES = ["All", "Politics", "Business & Economy", "World", "India"];

const SUBCATEGORY_MAP = {
  Politics: [
    "Elections & Power Transitions",
    "Government Policies & Bills",
    "Public Institutions & Judiciary",
    "Geopolitics & Diplomacy",
  ],
  "Business & Economy": [
    "Macroeconomy",
    "Industries",
    "Markets & Finance",
    "Trade & Tariffs",
    "Corporate Developments",
  ],
  World: [
    "International Conflicts",
    "Global Governance",
    "Migration & Humanitarian Crises",
    "Elections Worldwide",
    "Science & Tech",
    "Environment",
  ],
  India: [
    "Social Issues",
    "Infrastructure & Development",
    "Science, Tech and Environment",
  ],
};

export default function HomeScreen({ navigation }) {
  const [themes, setThemes] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");

  const [sortMode, setSortMode] = useState("relevance"); // "relevance" | "updated" | "published"
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { themeColors } = useUserData() || {};
  const palette = themeColors || getThemeColors(false);
  const styles = useMemo(() => createStyles(palette), [palette]);

  // -------------------------------
  // FETCH STORIES + THEMES
  // -------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const themeSnap = await getDocs(collection(db, "themes"));
        const storySnap = await getDocs(collection(db, "stories"));

        const themeData = themeSnap.docs.map((d) => ({
          id: d.id,
          type: "theme",
          ...d.data(),
        }));

        const storyData = storySnap.docs.map((d) => ({
          id: d.id,
          type: "story",
          ...d.data(),
        }));

        setThemes(themeData);
        setStories(storyData);
        setStorySearchCache(storyData); // used by search screen / cache
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // -------------------------------
  // FILTER HELPERS
  // -------------------------------
  const matchesCategory = (item, category) => {
    if (category === "All") return true;

    const allCats = Array.isArray(item.allCategories)
      ? item.allCategories
      : item.category
      ? [item.category]
      : [];

    const target = category.toLowerCase();
    return allCats.some((c) => (c || "").toLowerCase() === target);
  };

  const matchesSubcategory = (item, subcat) => {
    if (subcat === "All") return true;

    const primary = item.subcategory;
    const secondary =
      Array.isArray(item.secondarySubcategories) &&
      item.secondarySubcategories.length
        ? item.secondarySubcategories
        : [];

    return primary === subcat || secondary.includes(subcat);
  };

  const filteredStories = useMemo(
    () =>
      stories.filter(
        (s) =>
          matchesCategory(s, activeCategory) &&
          matchesSubcategory(s, activeSubcategory)
      ),
    [stories, activeCategory, activeSubcategory]
  );

  const filteredThemes = useMemo(
    () =>
      themes.filter(
        (t) =>
          matchesCategory(t, activeCategory) &&
          matchesSubcategory(t, activeSubcategory)
      ),
    [themes, activeCategory, activeSubcategory]
  );

  // -------------------------------
  // FEATURED ITEMS
  // -------------------------------
  const TOP_N = 3;

  const isPinnedForCategory = (item, category) => {
    const pinned = item.isPinned === true || item.isPinnedFeatured === true;
    if (!pinned) return false;

    if (!item.pinnedCategory || item.pinnedCategory === "All") return true;
    return item.pinnedCategory === category;
  };

  const combinedItems = useMemo(
    () => [...filteredStories, ...filteredThemes],
    [filteredStories, filteredThemes]
  );

  const featuredItems = useMemo(() => {
    // No featured when subcategory is active:
    if (activeSubcategory !== "All") return [];

    const pinned = combinedItems.filter((item) =>
      isPinnedForCategory(item, activeCategory)
    );
    const pinnedKeys = new Set(pinned.map((item) => `${item.type}-${item.id}`));

    const auto = combinedItems
      .filter((item) => !pinnedKeys.has(`${item.type}-${item.id}`))
      .sort((a, b) => scoreContent(b) - scoreContent(a));

    return [...pinned, ...auto].slice(0, TOP_N);
  }, [combinedItems, activeCategory, activeSubcategory]);

  // -------------------------------
  // REGULAR COMBINED FEED (EXCLUDING FEATURED)
  // -------------------------------
  const regularCombined = useMemo(() => {
    const featuredKeys = new Set(
      featuredItems.map((item) => `${item.type}-${item.id}`)
    );

    const remaining = combinedItems.filter(
      (item) => !featuredKeys.has(`${item.type}-${item.id}`)
    );

    if (sortMode === "updated") {
      return [...remaining].sort((a, b) => safeTimestamp(b) - safeTimestamp(a));
    }

    if (sortMode === "published") {
      return [...remaining].sort(
        (a, b) => getCreatedAtMs(b) - getCreatedAtMs(a)
      );
    }

    // default: relevance
    return [...remaining].sort((a, b) => scoreContent(b) - scoreContent(a));
  }, [combinedItems, featuredItems, sortMode]);

  // -------------------------------
  // LOADING STATE
  // -------------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    );
  }

  // -------------------------------
  // RENDER HELPERS
  // -------------------------------
  const renderFeaturedCard = (item) => (
    <View
      key={`${item.type}-${item.id}`}
      style={styles.featuredCardWrapper}
    >
      <WWHomeCard item={item} navigation={navigation} />
    </View>
  );

  const renderRegularItem = ({ item }) => {
    // Compact items in main feed only
    if (item.isCompactCard) {
      return <WWCompactCard item={item} navigation={navigation} />;
    }

    // Full card
    return <WWHomeCard item={item} navigation={navigation} />;
  };

  // -------------------------------
  // MAIN RENDER
  // -------------------------------
  return (
    <View style={styles.container}>
      <FlatList
        data={regularCombined}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={renderRegularItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            {/* CATEGORY PILLS */}
            <View style={styles.filterWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {CATEGORIES.map((cat) => {
                  const active = cat === activeCategory;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => {
                        setActiveCategory(cat);
                        setActiveSubcategory("All");
                      }}
                      style={[
                        styles.categoryPill,
                        active && styles.categoryPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          active && styles.categoryTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* SUBCATEGORY ROW */}
            {activeCategory !== "All" && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subcategoryRow}
              >
                <TouchableOpacity
                  onPress={() => setActiveSubcategory("All")}
                  style={styles.subcategoryTextWrap}
                >
                  <Text
                    style={[
                      styles.subcategoryText,
                      activeSubcategory === "All" &&
                        styles.subcategoryTextActive,
                    ]}
                  >
                    ALL
                  </Text>
                </TouchableOpacity>

                {(SUBCATEGORY_MAP[activeCategory] || []).map((sub) => (
                  <TouchableOpacity
                    key={sub}
                    onPress={() => setActiveSubcategory(sub)}
                    style={styles.subcategoryTextWrap}
                  >
                    <Text
                      style={[
                        styles.subcategoryText,
                        activeSubcategory === sub &&
                          styles.subcategoryTextActive,
                      ]}
                    >
                      {sub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* FEATURED SECTION */}
            {featuredItems.length > 0 && (
              <View style={styles.featuredSection}>
                <Text style={styles.featuredHeader}>Featured</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredRow}
                >
                  {featuredItems.map(renderFeaturedCard)}
                </ScrollView>
              </View>
            )}

            {/* SORT DROPDOWN */}
            <TouchableOpacity
              onPress={() => setShowSortMenu(true)}
              style={[
                styles.dropdownButton,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                },
              ]}
            >
              <Text style={styles.dropdownButtonText}>
                Sort:{" "}
                {sortMode === "relevance"
                  ? "Relevance"
                  : sortMode === "updated"
                  ? "Recently Updated"
                  : "Recently Published"}
              </Text>

              <Ionicons
                name="chevron-down-outline"
                size={18}
                color={palette.textPrimary}
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </>
        }
      />

      {/* SORT MODAL */}
      <Modal
        visible={showSortMenu}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSortMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          onPress={() => setShowSortMenu(false)}
        >
          <View style={styles.modalContent}>
            {[
              { key: "relevance", label: "Relevance" },
              { key: "updated", label: "Recently Updated" },
              { key: "published", label: "Recently Published" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.modalOption}
                onPress={() => {
                  setSortMode(opt.key);
                  setShowSortMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    sortMode === opt.key && styles.selectedOptionText,
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

    // Loading
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 8,
      color: palette.textSecondary,
    },

    // Filters
    filterWrapper: {
      borderBottomWidth: 1,
      borderColor: palette.border,
      paddingVertical: 10,
      backgroundColor: palette.surface,
    },
    categoryRow: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
    },
    categoryPill: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 14,
      backgroundColor: palette.surface,
    },
    categoryPillActive: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    categoryText: {
      fontSize: 13,
      color: palette.textSecondary,
    },
    categoryTextActive: {
      color: "#fff",
      fontWeight: "600",
    },

    subcategoryRow: {
      flexDirection: "row",
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    subcategoryTextWrap: {
      justifyContent: "center",
    },
    subcategoryText: {
      fontSize: 13,
      color: palette.textSecondary,
      textDecorationLine: "underline",
    },
    subcategoryTextActive: {
      color: palette.accent,
      fontWeight: "600",
    },

    // Featured section
    featuredSection: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    featuredHeader: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
      marginBottom: 8,
    },
    featuredRow: {
      paddingBottom: 4,
    },
    featuredCardWrapper: {
      width: 260,
      marginRight: 16,
    },

    // Sort dropdown
    dropdownButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: palette.surface,
      marginTop: 8,
      borderRadius: 8,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: palette.border,
    },
    dropdownButtonText: {
      fontSize: 14,
      color: palette.textPrimary,
    },

    // Sort modal
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
      padding: 30,
    },
    modalContent: {
      backgroundColor: palette.surface,
      borderRadius: 10,
    },
    modalOption: {
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    modalOptionText: {
      fontSize: 16,
      color: palette.textPrimary,
    },
    selectedOptionText: {
      fontWeight: "bold",
      color: palette.accent,
    },

    // Main list separator
    separator: {
      height: 16,
    },
  });
