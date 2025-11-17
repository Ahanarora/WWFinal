// ----------------------------------------
// screens/HomeScreen.js
// Category → Featured Stories → Featured Themes → Regular Stories + Themes
// All filtered & ranked by category
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
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { scoreContent } from "../utils/ranking";
import { formatUpdatedAt } from "../utils/formatTime";
import { getLatestHeadlines } from "../utils/getLatestHeadlines";
import { colors } from "../styles/theme";

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

        // Rank globally by StoryScore
        const rankedThemes = [...themeData].sort(
          (a, b) => scoreContent(b) - scoreContent(a)
        );
        const rankedStories = [...storyData].sort(
          (a, b) => scoreContent(b) - scoreContent(a)
        );

        setThemes(rankedThemes);
        setStories(rankedStories);
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
  // ⭐ NEW SMART FEATURED LOGIC (WITH PIN OVERRIDE)
  // Option C — Pinned items override selection, NOT ordering
  // -------------------------------
  const TOP_N = 3;

  function getFeaturedItems(items, category) {
    // 1️⃣ Pinned (forced include)
    const pinned = items.filter(
      (i) =>
        i.isPinnedFeatured === true &&
        (i.pinnedCategory === "All" || i.pinnedCategory === category)
    );

    // 2️⃣ Auto-ranked (exclude pinned)
    const auto = items
      .filter((i) => !i.isPinnedFeatured)
      .sort((a, b) => scoreContent(b) - scoreContent(a));

    // 3️⃣ Merge pinned + auto and limit to 3
    const combined = [...pinned, ...auto].slice(0, TOP_N);

    // 4️⃣ Final order always by StoryScore (Option C)
    return combined.sort((a, b) => scoreContent(b) - scoreContent(a));
  }

  // Featured Stories/Themes using new logic
  const featuredStories = getFeaturedItems(filteredStories, activeCategory);
  const featuredThemes = getFeaturedItems(filteredThemes, activeCategory);

  // -------------------------------
  // REGULAR COMBINED FEED
  // stories + themes (non-featured), ranked together
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

    // Sort combined feed by StoryScore
    return combined.sort((a, b) => scoreContent(b) - scoreContent(a));
  }, [filteredStories, filteredThemes, featuredStories, featuredThemes]);

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
  const renderHeadlineBullets = (timeline) => {
    const headlines = getLatestHeadlines(timeline);
    if (!headlines.length) return null;

    return (
      <View style={styles.headlineList}>
        <Text style={styles.latestLabel}>Latest updates</Text>
        {headlines.map((headline) => (
          <View key={headline.id} style={styles.headlineRow}>
            <View style={styles.headlineBullet} />
            <View style={{ flex: 1 }}>
              <Text style={styles.headlineText}>{headline.title}</Text>
            </View>
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
        {item.overview ? (
          <Text style={styles.overviewPreview} numberOfLines={2}>
            {item.overview}
          </Text>
        ) : null}
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
        {item.overview ? (
          <Text style={styles.overviewPreview} numberOfLines={2}>
            {item.overview}
          </Text>
        ) : null}
        {renderHeadlineBullets(item.timeline)}
      </View>
    </TouchableOpacity>
  );

  const renderRegularItem = ({ item }) => {
    if (item._kind === "story") {
      const headlines = getLatestHeadlines(item.timeline);
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
            <Text style={styles.updatedText}>
              {formatUpdatedAt(item.updatedAt)}
            </Text>
            {item.overview ? (
              <Text style={styles.overviewPreview} numberOfLines={2}>
                {item.overview}
              </Text>
            ) : null}
            {headlines.length > 0 ? (
              <View style={styles.headlineList}>
                <Text style={styles.latestLabel}>Latest updates</Text>
                {headlines.map((headline) => (
                  <View key={headline.id} style={styles.headlineRow}>
                    <View style={styles.headlineBullet} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.headlineText}>{headline.title}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    }

    // Theme
    const headlines = getLatestHeadlines(item.timeline);
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
          <Text style={styles.updatedText}>
            {formatUpdatedAt(item.updatedAt)}
          </Text>
          {item.overview ? (
            <Text style={styles.overviewPreview} numberOfLines={2}>
              {item.overview}
            </Text>
          ) : null}
          {headlines.length > 0 ? (
            <View style={styles.headlineList}>
              <Text style={styles.latestLabel}>Latest updates</Text>
              {headlines.map((headline) => (
                <View key={headline.id} style={styles.headlineRow}>
                  <View style={styles.headlineBullet} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.headlineText}>{headline.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  // -------------------------------
  // MAIN RENDER
  // -------------------------------
  return (
    <View style={styles.container}>
      {/* 🟧 CATEGORY PILLS */}
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

      {/* 🔵 FEATURED STORIES */}
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

      {/* 🟩 FEATURED THEMES */}
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

      {/* 🟨 REGULAR STORIES + THEMES (COMBINED) */}
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

  // Category filter
  filterWrapper: {
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
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
  categoryText: {
    fontSize: 13,
    color: "#4B5563",
  },
  categoryTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  // Featured sections
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
    shadowColor: "#0F172A",
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
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

  // Regular cards
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
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
    backgroundColor: "#eee",
  },
  placeholder: {
    height: 200,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#999",
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
  separator: {
    height: 16,
  },

  // Loading
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#6B7280",
    marginTop: 8,
  },
  updatedText: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
  },

  headlineList: {
    marginTop: 12,
    gap: 6,
  },
  latestLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
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
    fontWeight: "500",
    lineHeight: 18,
  },
  overviewPreview: {
    marginTop: 2,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
