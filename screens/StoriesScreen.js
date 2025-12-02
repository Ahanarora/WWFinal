// ----------------------------------------
// screens/StoriesScreen.js
// Updated: Uses WWStoryCard + WWCompactCard
// ----------------------------------------

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { scoreContent } from "../utils/ranking";
import { getThemeColors } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";

import WWStoryCard from "../components/WWStoryCard";
import WWCompactCard from "../components/WWCompactCard";

// -----------------------------
// CATEGORIES
// -----------------------------
const CATEGORIES = [
  "All",
  "Politics",
  "Business & Economy",
  "World",
  "India",
];

const CATEGORY_LABELS = {
  All: "All",
  Politics: "Politics",
  "Business & Economy": "Business & Economy",
  World: "World",
  India: "India",
};

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

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [sortMode, setSortMode] = useState("relevance");
  const [showSortMenu, setShowSortMenu] = useState(false);

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
          id: d.id,
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
    const secondary =
      Array.isArray(item.secondarySubcategories)
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
  // CARD RENDERER
  // -----------------------------
  const renderStoryCard = ({ item }) => {
    if (item.isCompactCard) {
      return <WWCompactCard item={item} navigation={navigation} />;
    }
    return <WWStoryCard item={item} navigation={navigation} />;
  };

  // -----------------------------
  // LOADING STATES
  // -----------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
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
  // UI
  // -----------------------------
  return (
    <View style={styles.container}>
      {/* FILTER pane */}
      <View style={styles.filterPane}>
        {/* Category pills */}
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
                  {CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Subcategories */}
        {activeCategory !== "All" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subcategoryRow}
          >
            <TouchableOpacity onPress={() => setActiveSubcategory("All")}>
              <Text
                style={[
                  styles.subcategoryText,
                  activeSubcategory === "All" && styles.subcategoryTextActive,
                ]}
              >
                ALL
              </Text>
            </TouchableOpacity>

            {(SUBCATEGORY_MAP[activeCategory] || []).map((sub) => (
              <TouchableOpacity
                key={sub}
                onPress={() => setActiveSubcategory(sub)}
              >
                <Text
                  style={[
                    styles.subcategoryText,
                    activeSubcategory === sub && styles.subcategoryTextActive,
                  ]}
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Sort dropdown */}
        <TouchableOpacity
          onPress={() => setShowSortMenu(true)}
          style={styles.dropdownButton}
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
          />
        </TouchableOpacity>
      </View>

      {/* Sort modal */}
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

      {/* Story list */}
      <FlatList
        data={sortedStories}
        keyExtractor={(item) => item.id}
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
      padding: 16,
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: { marginTop: 8, color: palette.textSecondary },
    emptyText: { fontSize: 16, color: palette.textSecondary },

    // FILTER PANE
    filterPane: {
      backgroundColor: palette.surface,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },

    categoryRow: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    categoryPill: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 6,
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
      paddingVertical: 6,
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

    // DROPDOWN
    dropdownButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: palette.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: palette.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dropdownButtonText: {
      fontSize: 14,
      color: palette.textPrimary,
    },

    // MODAL
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
      padding: 30,
    },
    modalContent: {
      backgroundColor: palette.surface,
      borderRadius: 10,
      overflow: "hidden",
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
  });
