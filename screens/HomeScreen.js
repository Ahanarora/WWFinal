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

  const tagItems = (items, kind) =>
    items.map((item) => ({
      ...item,
      _kind: kind,
    }));

  const isPinnedForCategory = (item, category) => {
    const pinned =
      item.isPinned === true ||
      item.isPinnedFeatured === true;
    if (!pinned) return false;

    if (!item.pinnedCategory || item.pinnedCategory === "All") return true;
    return item.pinnedCategory === category;
  };

  const combinedItems = useMemo(() => {
    const taggedStories = tagItems(filteredStories, "story");
    const taggedThemes = tagItems(filteredThemes, "theme");
    return [...taggedStories, ...taggedThemes];
  }, [filteredStories, filteredThemes]);

  const featuredItems = useMemo(() => {
    const pinned = combinedItems.filter((item) =>
      isPinnedForCategory(item, activeCategory)
    );
    const pinnedKeys = new Set(
      pinned.map((item) => `${item._kind}-${item.id}`)
    );

    const auto = combinedItems
      .filter((item) => !pinnedKeys.has(`${item._kind}-${item.id}`))
      .sort((a, b) => scoreContent(b) - scoreContent(a));

    return [...pinned, ...auto].slice(0, TOP_N);
  }, [combinedItems, activeCategory]);

  // -------------------------------
  // REGULAR COMBINED FEED SORTING
  // -------------------------------
  const regularCombined = useMemo(() => {
    const featuredKeys = new Set(
      featuredItems.map((item) => `${item._kind}-${item.id}`)
    );

    const remaining = combinedItems.filter(
      (item) => !featuredKeys.has(`${item._kind}-${item.id}`)
    );

    if (sortMode === "updated") {
      return remaining.sort(
        (a, b) =>
          safeTimestamp({ updatedAt: b.updatedAt }) -
          safeTimestamp({ updatedAt: a.updatedAt })
      );
    }

    if (sortMode === "published") {
      return remaining.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
    }

    return remaining.sort((a, b) => scoreContent(b) - scoreContent(a));
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

  const renderCompactCard = (item, typeLabel, onPress, keyOverride) => (
    <TouchableOpacity
      key={keyOverride || item.id}
      style={styles.compactCard}
      onPress={onPress}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.compactThumbnail} />
      ) : (
        <View style={[styles.compactThumbnail, styles.compactPlaceholder]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.compactBody}>
        <Text style={styles.compactType}>{typeLabel}</Text>
        <Text style={styles.compactTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getTypeLabel = (kind) => (kind === "story" ? "Story" : "Theme");

  const findStoryById = (id) =>
    filteredStories.find((story) => story.id === id) ||
    stories.find((story) => story.id === id);

  const findThemeById = (id) =>
    filteredThemes.find((theme) => theme.id === id) ||
    themes.find((theme) => theme.id === id);

  const renderFeaturedCard = (item) => {
    const typeLabel = getTypeLabel(item._kind);

    const onPress = () => {
      if (item._kind === "story") {
        const target = findStoryById(item.id) || item;
        const storyIndex = filteredStories.findIndex((s) => s.id === item.id);
        navigation.navigate("Story", {
          story: target,
          index: storyIndex >= 0 ? storyIndex : 0,
          allStories: filteredStories,
        });
      } else {
        const target = findThemeById(item.id) || item;
        const themeIndex = filteredThemes.findIndex((t) => t.id === item.id);
        navigation.navigate("Theme", {
          theme: target,
          index: themeIndex >= 0 ? themeIndex : 0,
          allThemes: filteredThemes,
        });
      }
    };

    if (item.isCompactCard) {
      return renderCompactCard(
        item,
        typeLabel,
        onPress,
        `${item._kind}-${item.id}`
      );
    }

    return (
      <TouchableOpacity
        key={`${item._kind}-${item.id}`}
        style={styles.featuredCard}
        onPress={onPress}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} />
        ) : (
          <View style={styles.featuredPlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.featuredBody}>
          <Text style={styles.featuredTypeLabel}>{typeLabel}</Text>
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
  };

  const renderRegularItem = ({ item }) => {
    const headlines = getLatestHeadlines(item.timeline);

    if (item._kind === "story") {
      const onPress = () =>
        navigation.navigate("Story", {
          story: item,
          index: filteredStories.indexOf(
            stories.find((s) => s.id === item.id)
          ),
          allStories: filteredStories,
        });

      if (item.isCompactCard) {
        return renderCompactCard(
          item,
          "Story",
          onPress,
          `${item._kind}-${item.id}`
        );
      }

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={onPress}
        >
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          <Text style={styles.mediaTypeLabel}>Story</Text>

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

    const onPress = () =>
      navigation.navigate("Theme", {
        theme: item,
        index: filteredThemes.indexOf(
          themes.find((t) => t.id === item.id)
        ),
        allThemes: filteredThemes,
      });

    if (item.isCompactCard) {
      return renderCompactCard(
        item,
        "Theme",
        onPress,
        `${item._kind}-${item.id}`
      );
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <Text style={styles.mediaTypeLabel}>Theme</Text>

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

    {/* MAIN FEED WITH SCROLLABLE HEADER */}
    <FlatList
      data={regularCombined}
      keyExtractor={(item) => `${item._kind}-${item.id}`}
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
} // end HomeScreen

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
  featuredTypeLabel: {
    fontSize: 11,
    color: colors.muted,
    textAlign: "right",
    textTransform: "uppercase",
    marginBottom: 4,
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

  mediaTypeLabel: {
    alignSelf: "flex-end",
    marginRight: 16,
    marginTop: 8,
    fontSize: 11,
    color: colors.muted,
    textTransform: "uppercase",
  },

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

  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
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
  compactBody: {
    flex: 1,
    gap: 4,
  },
  compactType: {
    fontSize: 11,
    textTransform: "uppercase",
    color: colors.muted,
    letterSpacing: 1,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: colors.textSecondary },
});
