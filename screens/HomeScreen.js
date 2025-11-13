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
  // SMART FEATURED LOGIC (TOP 3)
  // -------------------------------
  const TOP_N = 3;

  // STORIES
  const storyBlockedIds = filteredStories
    .filter((s) => s.isFeatured === false)
    .map((s) => s.id);

  const storyAutoCandidates = filteredStories.filter(
    (s) => !storyBlockedIds.includes(s.id)
  );

  const storyAutoTop = storyAutoCandidates
    .slice(0, TOP_N)
    .map((s) => s.id);

  const featuredStories = filteredStories.filter((s) => {
    const id = s.id;
    if (s.isFeatured === false) return false;
    if (s.isFeatured === true && storyAutoTop.includes(id)) return true;
    if (storyAutoTop.includes(id)) return true;
    return false;
  });

  const regularStories = filteredStories.filter(
    (s) => !featuredStories.some((f) => f.id === s.id)
  );

  // THEMES
  const themeBlockedIds = filteredThemes
    .filter((t) => t.isFeatured === false)
    .map((t) => t.id);

  const themeAutoCandidates = filteredThemes.filter(
    (t) => !themeBlockedIds.includes(t.id)
  );

  const themeAutoTop = themeAutoCandidates
    .slice(0, TOP_N)
    .map((t) => t.id);

  const featuredThemes = filteredThemes.filter((t) => {
    const id = t.id;
    if (t.isFeatured === false) return false;
    if (t.isFeatured === true && themeAutoTop.includes(id)) return true;
    if (themeAutoTop.includes(id)) return true;
    return false;
  });

  const regularThemes = filteredThemes.filter(
    (t) => !featuredThemes.some((f) => f.id === t.id)
  );

  // -------------------------------
  // REGULAR COMBINED FEED
  // stories + themes (non-featured), ranked together
  // -------------------------------
  const regularCombined = useMemo(() => {
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
  }, [regularStories, regularThemes]);

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
      <Text style={styles.featuredTitle} numberOfLines={2}>
        {item.title}
      </Text>
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
      <Text style={styles.featuredTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderRegularItem = ({ item }) => {
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
            <Text style={styles.overview} numberOfLines={3}>
              {item.overview}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Theme
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
          <Text style={styles.overview} numberOfLines={3}>
            {item.overview}
          </Text>
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
    backgroundColor: "#f9fafb",
  },

  // Category filter
  filterWrapper: {
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
    backgroundColor: "#fff",
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
    width: 220,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
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
  featuredTitle: {
    fontSize: 15,
    fontWeight: "600",
    padding: 8,
  },

  // Regular cards
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
    padding: 16,
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
  overview: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
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
});
