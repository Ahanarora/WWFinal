// ----------------------------------------
// screens/ThemesScreen.js
// Ranked Themes + DROPDOWN SORT
// ----------------------------------------

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { scoreContent } from "../utils/ranking";

import { formatUpdatedAt } from "../utils/formatTime";
import { getLatestHeadlines } from "../utils/getLatestHeadlines";
import { colors } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";

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


/**
 * ⭐ Safe timestamp normalizer for sorting.
 * PRIORITY:
 *   createdAt → publishedAt → updatedAt
 */
const safeTimestamp = (item) => {
  if (!item) return 0;

  const t = item.createdAt || item.publishedAt || item.updatedAt;
  if (!t) return 0;

  if (typeof t.toDate === "function") return t.toDate().getTime();
  if (t.seconds) return t.seconds * 1000;

  const d = new Date(t);
  return isNaN(d) ? 0 : d.getTime();
};

/** ONLY createdAt for Recently Published */
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

  const [sortMode, setSortMode] = useState("relevance");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  // ----------------------------------
  // FETCH THEMES
  // ----------------------------------
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const snapshot = await getDocs(collection(db, "themes"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setThemes(data);
      } catch (err) {
        console.error("Error fetching themes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchThemes();
  }, []);

  // ----------------------------------
  // FILTER + SORTED THEMES
  // ----------------------------------
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

  const filteredThemes = useMemo(
    () => themes.filter((t) => matchesCategory(t, activeCategory)),
    [themes, activeCategory]
  );

  const sortedThemes = useMemo(() => {
    const list = [...filteredThemes];

    // 🔥 Recently Updated → updatedAt only
    if (sortMode === "updated") {
      return list.sort(
        (a, b) =>
          safeTimestamp({ updatedAt: b.updatedAt }) -
          safeTimestamp({ updatedAt: a.updatedAt })
      );
    }

    // 🔥 Recently Published → createdAt only
    if (sortMode === "published") {
      return list.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
    }

    // Default relevance
    return list.sort((a, b) => scoreContent(b) - scoreContent(a));
  }, [filteredThemes, sortMode]);

  // ----------------------------------
  // LOADING STATES
  // ----------------------------------
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
        <Text style={styles.emptyText}>No themes available yet.</Text>
      </View>
    );
  }

  // ----------------------------------
  // RENDER THEME CARD
  // ----------------------------------
  const renderCompactThemeCard = (theme, index) => (
    <TouchableOpacity
      key={theme.id}
      style={styles.compactCard}
      onPress={() =>
        navigation.navigate("Theme", {
          theme,
          index,
          allThemes: sortedThemes,
        })
      }
    >
      {theme.imageUrl ? (
        <Image source={{ uri: theme.imageUrl }} style={styles.compactThumbnail} />
      ) : (
        <View style={[styles.compactThumbnail, styles.compactPlaceholder]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <Text style={styles.compactTitle} numberOfLines={2}>
        {theme.title}
      </Text>
    </TouchableOpacity>
  );

  const renderThemeCard = (theme, index) => {
    if (theme.isCompactCard) {
      return renderCompactThemeCard(theme, index);
    }

    const headlines = getLatestHeadlines(theme.timeline);
    return (
      <TouchableOpacity
        key={theme.id}
        onPress={() =>
          navigation.navigate("Theme", {
            theme,
            index,
            allThemes: sortedThemes,
          })
        }
        style={styles.card}
      >
        {theme.imageUrl ? (
          <Image source={{ uri: theme.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{theme.title}</Text>
          <Text style={styles.updated}>{formatUpdatedAt(theme.updatedAt)}</Text>

          {theme.overview ? (
            <Text style={styles.overviewPreview} numberOfLines={2}>
              {theme.overview}
            </Text>
          ) : null}

          {headlines.length > 0 && (
            <View style={styles.headlineList}>
              <Text style={styles.latestLabel}>Latest updates</Text>
              {headlines.map((headline) => (
                <View key={headline.id} style={styles.headlineRow}>
                  <View style={styles.headlineBullet} />
                  <Text style={styles.headlineText}>{headline.title}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ----------------------------------
  // UI
  // ----------------------------------
  return (
    <View style={styles.container}>
      {/* FILTER PANE (match Stories/Home) */}
      <View style={styles.filterPane}>
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
                  {CATEGORY_LABELS[cat] || cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
            color="#000"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>


      {/* Modal */}
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

      <ScrollView style={{ marginTop: 12 }}>
        {sortedThemes.map((theme, index) => renderThemeCard(theme, index))}
      </ScrollView>
    </View>
  );
}

// ----------------------------------------
// STYLES
// ----------------------------------------
const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.background, flex: 1 },

  dropdownButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#000",
  },
  filterWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  categoryPill: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  categoryPillActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  categoryText: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: "none",
  },
  categoryTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 30,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedOptionText: {
    fontWeight: "bold",
    color: colors.accent,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: colors.textSecondary },
  emptyText: { fontSize: 16, color: colors.textSecondary },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 22,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },

  image: {
    width: "100%",
    height: 200,
    backgroundColor: "#e2e8f0",
  },
  placeholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: "#888" },

  content: { padding: 20, gap: 8 },

  title: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  updated: { fontSize: 13, color: colors.muted },

  headlineList: { marginTop: 12, gap: 6 },
  latestLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: "uppercase",
  },
  headlineRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  headlineBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 9,
    backgroundColor: "#38BDF8",
  },
  headlineText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  overviewPreview: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginBottom: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E0E7FF",
    gap: 12,
  },
  compactThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  compactPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  compactTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
