// ----------------------------------------
// screens/StoriesScreen.js
// Clean version using WWFilterPaneStories
// ----------------------------------------

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from "react-native";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { scoreContent } from "../utils/ranking";
import { getThemeColors } from "../styles/theme";

import WWStoryCard from "../components/WWStoryCard";
import WWCompactCard from "../components/WWCompactCard";
import WWFilterPaneStories from "../components/WWFilterPaneStories";

// -----------------------------
// TAXONOMY (passed as props)
// -----------------------------
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

// -----------------------------
// Timestamp helpers
// -----------------------------
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

// -----------------------------
// MAIN COMPONENT
// -----------------------------
export default function StoriesScreen({ navigation }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter pane states
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [sortMode, setSortMode] = useState("relevance");

  const palette = getThemeColors(false);
  const styles = useMemo(() => createStyles(palette), [palette]);

  // -----------------------------
  // FETCH STORIES
  // -----------------------------
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const snap = await getDocs(collection(db, "stories"));
        const data = snap.docs.map((d) => ({
          docId: d.id, // Firestore document ID
          type: "story",
          ...d.data(),
        }));
        setStories(data);
      } catch (err) {
        console.error("Error loading stories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  // -----------------------------
  // FILTER + SORT
  // -----------------------------
  const matchesCategory = (item, category) => {
    if (category === "All") return true;

    const cats = Array.isArray(item.allCategories)
      ? item.allCategories
      : item.category
      ? [item.category]
      : [];

    return cats
      .map((c) => (c || "").toLowerCase())
      .includes(category.toLowerCase());
  };

  const matchesSubcategory = (item, sub) => {
    if (sub === "All") return true;

    const primary = item.subcategory;
    const secondary = Array.isArray(item.secondarySubcategories)
      ? item.secondarySubcategories
      : [];

    return primary === sub || secondary.includes(sub);
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

  const sortedStories = useMemo(() => {
    const list = [...filteredStories];

    if (sortMode === "updated") {
      return list.sort((a, b) => safeTimestamp(b) - safeTimestamp(a));
    }
    if (sortMode === "published") {
      return list.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
    }

    return list.sort((a, b) => scoreContent(b) - scoreContent(a));
  }, [filteredStories, sortMode]);

  // -----------------------------
  // NAVIGATION WRAPPER
  // -----------------------------
  const navigateToStory = (item) => {
    const index = sortedStories.findIndex((s) => s.docId === item.docId);

    navigation.navigate("Story", {
      story: item, 
      index,
      allStories: sortedStories,
    });
  };

  // -----------------------------
  // CARD RENDERER
  // -----------------------------
  const renderStoryCard = ({ item }) => {
    if (item.isCompactCard) {
      return (
        <WWCompactCard
          item={item}
          navigation={navigation}
          onPress={() => navigateToStory(item)}
        />
      );
    }

    return (
      <WWStoryCard
        item={item}
        navigation={navigation}
        onPress={() => navigateToStory(item)}
      />
    );
  };

  // -----------------------------
  // LOADING STATES
  // -----------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading stories...</Text>
      </View>
    );
  }

  if (sortedStories.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No stories found.</Text>
      </View>
    );
  }

  // -----------------------------
  // MAIN UI
  // -----------------------------
  return (
    <View style={styles.container}>
      {/* PINNED FILTER PANE */}
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

      {/* STORY LIST */}
      <FlatList
        data={sortedStories}
        keyExtractor={(item) => item.docId || item.id}
        renderItem={renderStoryCard}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
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

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: { marginTop: 8, color: palette.textSecondary },
    emptyText: { fontSize: 16, color: palette.textSecondary },
  });
