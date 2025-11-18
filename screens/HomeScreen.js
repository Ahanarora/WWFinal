// ----------------------------------------
// screens/HomeScreen.js
// Category → Featured Stories → Featured Themes → Regular Combined Feed
// NOW WITH FIXED SORT LOGIC
// ----------------------------------------

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { scoreContent } from "../utils/ranking";

import { formatUpdatedAt } from "../utils/formatTime";
import { getLatestHeadlines } from "../utils/getLatestHeadlines";
import { colors } from "../styles/theme";

// Safe unified timestamp helper
const safeTimestamp = (item) => {
  if (!item) return 0;

  const t = item.createdAt || item.publishedAt || item.updatedAt;
  if (!t) return 0;

  if (typeof t.toDate === "function") return t.toDate().getTime();
  if (t.seconds) return t.seconds * 1000;

  const d = new Date(t);
  return isNaN(d) ? 0 : d.getTime();
};

// Only createdAt for Recently Published
const getCreatedAtMs = (item) => {
  const t = item.createdAt;
  if (!t) return 0;

  if (typeof t.toDate === "function") return t.toDate().getTime();
  if (t.seconds) return t.seconds * 1000;

  const d = new Date(t);
  return isNaN(d) ? 0 : d.getTime();
};

// Categories for top filter
const CATEGORIES = [
  "All",
  "Politics",
  "Economy",
  "Environment",
  "Science & Tech",
  "Health",
  "World",
  "Culture",
  "Sports",
  "Other",
];

export default function HomeScreen({ navigation }) {
  const [themes, setThemes] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  const [sortMode, setSortMode] = useState("relevance");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // -------------------------------
  // FETCH STORIES + THEMES
  // -------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const themeSnap = await getDocs(collection(db, "themes"));
        const storySnap = await getDocs(collection(db, "stories"));

        const themeData = themeSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const storyData = storySnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setThemes(themeData);
        setStories(storyData);
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // -------------------------------
  // FILTER BY CATEGORY
  // -------------------------------
  const filteredStories = useMemo(() => {
    if (activeCategory === "All") return stories;
    return stories.filter((s) => s.category === activeCategory);
  }, [stories, activeCategory]);

  const filteredThemes = useMemo(() => {
    if (activeCategory === "All") return themes;
    return themes.filter((t) => t.category === activeCategory);
  }, [themes, activeCategory]);

  // -------------------------------
  // FEATURED ITEMS
  // -------------------------------
  const TOP_N = 3;

  function getFeaturedItems(items, category) {
    const pinned = items.filter(
      (i) =>
        i.isPinnedFeatured === true &&
        (i.pinnedCategory === "All" || i.pinnedCategory === category)
    );

    const auto = items
      .filter((i) => !i.isPinnedFeatured)
      .sort((a, b) => scoreContent(b) - scoreContent(a));

    return [...pinned, ...auto].slice(0, TOP_N);
  }

  const featuredStories = getFeaturedItems(filteredStories, activeCategory);
  const featuredThemes = getFeaturedItems(filteredThemes, activeCategory);

  // -------------------------------
  // REGULAR COMBINED FEED SORTING
  // -------------------------------
  const regularCombined = useMemo(() => {
    const featuredStoryIds = featuredStories.map((s) => s.id);
    const featuredThemeIds = featuredThemes.map((t) => t.id);

    const regularStories = filteredStories.filter(
      (s) => !featuredStoryIds.includes(s.id)
    );
    const regularThemes = filteredThemes.filter(
      (t) => !featuredThemeIds.includes(t.id)
    );

    const taggedStories = regularStories.map((s) => ({
      ...s,
      _kind: "story",
    }));
    const taggedThemes = regularThemes.map((t) => ({
      ...t,
      _kind: "theme",
    }));

    const combined = [...taggedStories, ...taggedThemes];

    // 🔥 Recently Updated
    if (sortMode === "updated") {
      return combined.sort(
        (a, b) =>
          safeTimestamp({ updatedAt: b.updatedAt }) -
          safeTimestamp({ updatedAt: a.updatedAt })
      );
    }

    // 🔥 Recently Published
    if (sortMode === "published") {
      return combined.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
    }

    // Default relevance
    return combined.sort((a, b) => scoreContent(b) - scoreContent(a));
  }, [
    filteredStories,
    filteredThemes,
    featuredStories,
    featuredThemes,
    sortMode,
  ]);

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
  // RENDER CARDS
  // -------------------------------
  const renderHeadlineBullets = (timeline) => {
    const headlines = getLatestHeadlines(timeline);
    if (!headlines.length) return null;

    return (
      <View style={styles.headlineList}>
        <Text style={styles.latestLabel}>Latest updates</Text>
        {headlines.map((headline) => (
          <View key={headline.id} style={styles.headlineRow}>
            <View style={styles.headlineBullet} />
            <Text style={styles.headlineText}>{headline.title}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderFeaturedStoryCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.featuredCard}
      onPress={() =>
        navigation.navigate("Story", {
          story: item,
          index: filteredStories.indexOf(item),
          allStories: filteredStories,
        })
      }
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} />
      ) : (
        <View style={styles.featuredPlaceholder}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.featuredBody}>
        <Text style={styles.featuredTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.overview && (
          <Text style={styles.overviewPreview} numberOfLines={2}>
            {item.overview}
          </Text>
        )}
        {renderHeadlineBullets(item.timeline)}
      </View>
    </TouchableOpacity>
  );

  const renderFeaturedThemeCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.featuredCard}
      onPress={() =>
        navigation.navigate("Theme", {
          theme: item,
          index: filteredThemes.indexOf(item),
          allThemes: filteredThemes,
        })
      }
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} />
      ) : (
        <View style={styles.featuredPlaceholder}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.featuredBody}>
        <Text style={styles.featuredTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.overview && (
          <Text style={styles.overviewPreview} numberOfLines={2}>
            {item.overview}
          </Text>
        )}
        {renderHeadlineBullets(item.timeline)}
      </View>
    </TouchableOpacity>
  );

  const renderRegularItem = ({ item }) => {
    const headlines = getLatestHeadlines(item.timeline);

    if (item._kind === "story") {
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate("Story", {
              story: item,
              index: filteredStories.indexOf(
                stories.find((s) => s.id === item.id)
              ),
              allStories: filteredStories,
            })
          }
        >
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          <View style={styles.textBlock}>
            <Text style={styles.typeBadge}>Story</Text>
            <Text style={styles.categoryLabel}>
              {item.category?.toUpperCase() || "GENERAL"}
            </Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.updatedText}>{formatUpdatedAt(item.updatedAt)}</Text>

            {item.overview && (
              <Text style={styles.overviewPreview} numberOfLines={2}>
                {item.overview}
              </Text>
            )}

            {renderHeadlineBullets(item.timeline)}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("Theme", {
            theme: item,
            index: filteredThemes.indexOf(
              themes.find((t) => t.id === item.id)
            ),
            allThemes: filteredThemes,
          })
        }
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.textBlock}>
          <Text style={[styles.typeBadge, styles.typeBadgeTheme]}>Theme</Text>
          <Text style={styles.categoryLabel}>
            {item.category?.toUpperCase() || "GENERAL"}
          </Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.updatedText}>{formatUpdatedAt(item.updatedAt)}</Text>

          {item.overview && (
            <Text style={styles.overviewPreview} numberOfLines={2}>
              {item.overview}
            </Text>
          )}

          {renderHeadlineBullets(item.timeline)}
        </View>
      </TouchableOpacity>
    );
  };

  // -------------------------------
  // MAIN RENDER
  // -------------------------------
  return (
    <View style={styles.container}>
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
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* FEATURED SECTIONS */}
      {featuredStories.length > 0 && (
        <View style={styles.featuredSection}>
          <Text style={styles.featuredHeader}>Featured Stories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredRow}
          >
            {featuredStories.map(renderFeaturedStoryCard)}
          </ScrollView>
        </View>
      )}

      {featuredThemes.length > 0 && (
        <View style={styles.featuredSection}>
          <Text style={styles.featuredHeader}>Featured Themes</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredRow}
          >
            {featuredThemes.map(renderFeaturedThemeCard)}
          </ScrollView>
        </View>
      )}

      {/* SORT DROPDOWN */}
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
      </TouchableOpacity>

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

      {/* REGULAR FEED */}
      <FlatList
        data={regularCombined}
        keyExtractor={(item) => `${item._kind}-${item.id}`}
        renderItem={renderRegularItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

// ----------------------------------------
// STYLES
// ----------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  filterWrapper: {
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },

  categoryRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },

  categoryPill: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#f8f8f8",
  },
  categoryPillActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  categoryText: { fontSize: 13, color: "#4B5563" },
  categoryTextActive: { color: "#fff", fontWeight: "600" },

  featuredSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  featuredHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  featuredRow: {
    paddingBottom: 4,
  },

  featuredCard: {
    width: 240,
    marginRight: 16,
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  featuredImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#eee",
  },
  featuredPlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  featuredBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },

  dropdownButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f2f2f2",
    marginTop: 8,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#000",
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

  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },

  image: {
    width: "100%",
    height: 200,
    backgroundColor: "#eee",
  },
  placeholder: {
    height: 200,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: "#999" },

  textBlock: {
    padding: 20,
    gap: 6,
  },

  typeBadge: {
    alignSelf: "flex-start",
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    marginBottom: 4,
  },
  typeBadgeTheme: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },

  categoryLabel: {
    fontSize: 12,
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  updatedText: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
  },

  overviewPreview: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  separator: {
    height: 16,
  },

  headlineList: {
    marginTop: 12,
    gap: 6,
  },
  latestLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: "uppercase",
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
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
    lineHeight: 18,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: colors.textSecondary },
});
