// ----------------------------------------
// screens/ThemesScreen.js
// Updated: Uses WWThemeCard + WWCompactCard + docId
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

import WWThemeCard from "../components/WWThemeCard";
import WWCompactCard from "../components/WWCompactCard";

// -------------------------------
// CATEGORY FILTERS
// -------------------------------
const CATEGORIES = ["All", "Politics", "Business & Economy", "World", "India"];

const CATEGORY_LABELS = {
  All: "All",
  Politics: "Politics",
  "Business & Economy": "Business & Economy",
  World: "World",
  India: "India",
};

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

export default function ThemesScreen({ navigation }) {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("All");
  const [sortMode, setSortMode] = useState("relevance");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const palette = getThemeColors(false);
  const styles = useMemo(() => createStyles(palette), [palette]);

  // -------------------------------
  // FETCH THEMES
  // -------------------------------
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const snapshot = await getDocs(collection(db, "themes"));
        const data = snapshot.docs.map((doc) => ({
          docId: doc.id,    // 🔑 Firestore document ID
          type: "theme",
          ...doc.data(),    // includes any internal id field
        }));
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

    // relevance default
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
        <ActivityIndicator size="large" color="#2563EB" />
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
  // UI
  // -------------------------------
  return (
    <View style={styles.container}>
      {/* FILTERS */}
      <View style={styles.filterPane}>
        {/* Category Pills */}
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
                onPress={() => setActiveCategory(cat)}
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

        {/* Sort */}
        <TouchableOpacity
          onPress={() => setShowSortMenu(true)}
          style={styles.dropdownButton}
        >
          <Ionicons
            name="swap-vertical-outline"
            size={16}
            color={palette.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.dropdownButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {/* Sort Modal */}
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

      {/* THEMES LIST */}
      <FlatList
        data={sortedThemes}
        keyExtractor={(item) => item.docId || item.id}
        renderItem={renderThemeCard}
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

    // FILTER AREA
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

    dropdownButton: {
      paddingVertical: 6,
      paddingHorizontal: 0,
      backgroundColor: "transparent",
      borderRadius: 0,
      borderWidth: 0,
      borderColor: "transparent",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    dropdownButtonText: {
      fontSize: 13,
      color: palette.textSecondary,
      fontWeight: "700",
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
