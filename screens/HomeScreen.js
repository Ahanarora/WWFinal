// ----------------------------------------
// screens/HomeScreen.js
// Now uses WWFilterPaneStories for category + subcategory + sort
// ----------------------------------------

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

import { scoreContent } from "../utils/ranking";
import { getThemeColors } from "../styles/theme";
import { useUserData } from "../contexts/UserDataContext";
import { setStorySearchCache } from "../utils/storyCache";

import WWHomeCard from "../components/WWHomeCard";
import WWCompactCard from "../components/WWCompactCard";

// ⬇ NEW SHARED FILTER-PANE
import WWFilterPaneStories from "../components/WWFilterPaneStories";

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
// (Same taxonomy as Stories & Themes)
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

// -------------------------------
// MAIN COMPONENT
// -------------------------------
export default function HomeScreen({ navigation }) {
  const [themes, setThemes] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(true);

  // Filter-pane shared states:
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [sortMode, setSortMode] = useState("relevance");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { themeColors } = useUserData() || {};
  const palette = themeColors || getThemeColors(false);
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
  // FETCH STORIES + THEMES
  // -------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const themeSnap = await getDocs(collection(db, "themes"));
        const storySnap = await getDocs(collection(db, "stories"));

        const themeData = themeSnap.docs.map((d) => {
          const raw = d.data() || {};
          return {
            docId: d.id,
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

        const storyData = storySnap.docs.map((d) => {
          const raw = d.data() || {};
          return {
            docId: d.id,
            type: "story",
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

        setThemes(themeData);
        setStories(storyData);
        setStorySearchCache(storyData);
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

    const arr = Array.isArray(item.allCategories)
      ? item.allCategories
      : item.category
      ? [item.category]
      : [];

    return arr.map((c) => (c || "").toLowerCase()).includes(category.toLowerCase());
  };

  const matchesSubcategory = (item, subcat) => {
    if (subcat === "All") return true;

    const primary = item.subcategory;
    const secondary = Array.isArray(item.secondarySubcategories)
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
  // FEATURED ITEMS LOGIC
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
    if (activeSubcategory !== "All") return [];

    const pinned = combinedItems.filter((item) =>
      isPinnedForCategory(item, activeCategory)
    );
    const pinnedKeys = new Set(
      pinned.map((item) => `${item.type}-${item.docId || item.id}`)
    );

    const auto = combinedItems
      .filter((i) => !pinnedKeys.has(`${i.type}-${i.docId || i.id}`))
      .sort((a, b) => scoreContent(b) - scoreContent(a));

    return [...pinned, ...auto].slice(0, TOP_N);
  }, [combinedItems, activeCategory, activeSubcategory]);

  // -------------------------------
  // REGULAR COMBINED FEED
  // -------------------------------
  const regularCombined = useMemo(() => {
    const keys = new Set(
      featuredItems.map((i) => `${i.type}-${i.docId || i.id}`)
    );

    const remaining = combinedItems.filter(
      (i) => !keys.has(`${i.type}-${i.docId || i.id}`)
    );

    if (sortMode === "updated")
      return [...remaining].sort((a, b) => safeTimestamp(b) - safeTimestamp(a));

    if (sortMode === "published")
      return [...remaining].sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));

    return [...remaining].sort((a, b) => scoreContent(b) - scoreContent(a));
  }, [combinedItems, featuredItems, sortMode]);

  // -------------------------------
  // LOADING
  // -------------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    );
  }

  // -------------------------------
  // RENDER HELPERS
  // -------------------------------
  const renderFeaturedCard = (item) => (
    <View
      key={`${item.type}-${item.docId || item.id}`}
      style={styles.featuredCardWrapper}
    >
      <WWHomeCard item={item} navigation={navigation} />
    </View>
  );

  const renderRegularItem = ({ item }) => {
    if (item.isCompactCard) {
      return <WWCompactCard item={item} navigation={navigation} />;
    }

    return <WWHomeCard item={item} navigation={navigation} />;
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <View style={styles.container}>

      {/* ⬇ REPLACED ENTIRE OLD UI WITH SHARED COMPONENT */}
      {filterVisible && (
        <WWFilterPaneStories
          categories={CATEGORIES}
          subcategories={SUBCATEGORY_MAP}
          activeCategory={activeCategory}
          activeSubcategory={activeSubcategory}
          onCategoryChange={(cat) => {
            setActiveCategory(cat);
            setActiveSubcategory("All");
          }}
          onSubcategoryChange={setActiveSubcategory}
        />
      )}

      {/* MAIN FEED */}
      <FlatList
        data={regularCombined}
        keyExtractor={(item) => `${item.type}-${item.docId || item.id}`}
        renderItem={renderRegularItem}
        onScroll={handleHeaderScroll}
        scrollEventThrottle={32}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          featuredItems.length > 0 ? (
            <View style={styles.featuredSection}>
              <View style={styles.featuredHeaderRow}>
              <Text style={styles.featuredHeader}>Featured</Text>
              {filterVisible && (
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
              )}
            </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredRow}
              >
                {featuredItems.map(renderFeaturedCard)}
              </ScrollView>
            </View>
          ) : null
        }
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
// STYLES (unchanged except header pane removed)
// ----------------------------------------
const createStyles = (palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },

    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: { marginTop: 8, color: palette.textSecondary },

    featuredSection: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    featuredHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    featuredHeader: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
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
    featuredRow: {
      paddingBottom: 4,
    },
    featuredCardWrapper: {
      width: 260,
      marginRight: 16,
    },

    separator: {
      height: 16,
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
