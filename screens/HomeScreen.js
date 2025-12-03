// ----------------------------------------
// screens/HomeScreen.js
// Now uses WWFilterPaneStories for category + subcategory + sort
// ----------------------------------------

import React, { useEffect, useState, useMemo } from "react";
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

  // Filter-pane shared states:
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [sortMode, setSortMode] = useState("relevance");

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
          docId: d.id,
          type: "theme",
          ...d.data(),
        }));

        const storyData = storySnap.docs.map((d) => ({
          docId: d.id,
          type: "story",
          ...d.data(),
        }));

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
      <WWFilterPaneStories
        categories={CATEGORIES}
        subcategories={SUBCATEGORY_MAP}
        activeCategory={activeCategory}
        activeSubcategory={activeSubcategory}
        sortMode={sortMode}
        onCategoryChange={(cat) => {
          setActiveCategory(cat);
          setActiveSubcategory("All");
        }}
        onSubcategoryChange={setActiveSubcategory}
        onSortChange={setSortMode}
      />

      {/* MAIN FEED */}
      <FlatList
        data={regularCombined}
        keyExtractor={(item) => `${item.type}-${item.docId || item.id}`}
        renderItem={renderRegularItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          featuredItems.length > 0 ? (
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
          ) : null
        }
      />
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

    separator: {
      height: 16,
    },
  });
