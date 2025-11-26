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
import { getThemeColors } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { useUserData } from "../contexts/UserDataContext";
import { setStorySearchCache } from "../utils/storyCache";



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

// Categories for top filter (predefined)
const CATEGORIES = [
  "All",
  "POLITICS",
  "BUSINESS & ECONOMY",
  "WORLD",
  "INDIA",
];

const SUBCATEGORY_MAP = {
  POLITICS: [
    "Elections & Power Transitions",
    "Government Policies & Bills",
    "Public Institutions & Judiciary",
    "Geopolitics & Diplomacy",
  ],
  "BUSINESS & ECONOMY": [
    "Macroeconomy",
    "Industries",
    "Markets & Finance",
    "Trade & Tariffs",
    "Corporate Developments",
  ],
  WORLD: [
    "International Conflicts",
    "Global Governance",
    "Migration & Humanitarian Crises",
    "Elections Worldwide",
    "Science & Tech",
    "Environment",
  ],
  INDIA: [
    "Social Issues",
    "Infrastructure & Development",
    "Science, Tech and Environment",
  ],
};

export default function HomeScreen({ navigation }) {
  const [themes, setThemes] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");

  const [sortMode, setSortMode] = useState("relevance");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const {
    user,
    favorites,
    toggleFavorite,
    getUpdatesSinceLastVisit,
    themeColors,
  } = useUserData();
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

        const themeData = themeSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const storyData = storySnap.docs.map((d) => ({ id: d.id, ...d.data() }));

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
  // FILTER BY CATEGORY
  // -------------------------------
  const matchesCategory = (item, category) => {
    if (category === "All") return true;
    const allCats = Array.isArray(item.allCategories)
      ? item.allCategories
      : item.category
      ? [item.category]
      : [];
    return allCats.includes(category);
  };

  const matchesSubcategory = (item, subcat) => {
    if (subcat === "All") return true;
    const primary = item.subcategory;
    const secondary =
      Array.isArray(item.secondarySubcategories) && item.secondarySubcategories.length
        ? item.secondarySubcategories
        : [];
    return primary === subcat || secondary.includes(subcat);
  };

  const filteredStories = useMemo(() => {
    return stories.filter(
      (s) =>
        matchesCategory(s, activeCategory) &&
        matchesSubcategory(s, activeSubcategory)
    );
  }, [stories, activeCategory, activeSubcategory]);

  const filteredThemes = useMemo(() => {
    return themes.filter(
      (t) =>
        matchesCategory(t, activeCategory) &&
        matchesSubcategory(t, activeSubcategory)
    );
  }, [themes, activeCategory, activeSubcategory]);

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
    if (activeSubcategory !== "All") return [];
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
  }, [combinedItems, activeCategory, activeSubcategory]);

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

  const renderCompactCard = (item, kind, onPress, keyOverride) => (
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
        {renderTypeBadge(kind, { marginBottom: 6 })}
        <Text style={styles.compactTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <FavoriteButton
          active={isFavorite(item)}
          onPress={() => handleFavoritePress(item)}
        />
      </View>
    </TouchableOpacity>
  );

  const findStoryById = (id) =>
    filteredStories.find((story) => story.id === id) ||
    stories.find((story) => story.id === id);

  const findThemeById = (id) =>
    filteredThemes.find((theme) => theme.id === id) ||
    themes.find((theme) => theme.id === id);

  const isFavorite = (item) => {
    if (!item?.id) return false;
    if (item._kind === "story") {
      return favorites?.stories?.includes(item.id);
    }
    return favorites?.themes?.includes(item.id);
  };

  const handleFavoritePress = (item) => {
    if (!user) {
      alert("Sign in to save items.");
      return;
    }
    const key = item._kind === "story" ? "stories" : "themes";
    toggleFavorite(key, item.id, item);
  };

  const updatesCount = (item) => {
    const type = item._kind === "story" ? "stories" : "themes";
    return getUpdatesSinceLastVisit(type, item);
  };

  const FavoriteButton = ({ active, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.favoriteButton}>
      <Ionicons
        name={active ? "bookmark" : "bookmark-outline"}
        size={18}
        color={active ? palette.accent : palette.muted}
      />
    </TouchableOpacity>
  );

  const renderUpdateBadge = (count) =>
    count > 0 ? (
      <View style={styles.updateBadge}>
        <Text style={styles.updateBadgeText}>
          {count} update{count > 1 ? "s" : ""} since you visited
        </Text>
      </View>
    ) : null;

  const renderTypeBadge = (kind, extraStyle) => (
    <View
      style={[
        styles.typeBadge,
        kind === "theme" && styles.typeBadgeTheme,
        extraStyle,
      ]}
    >
      <Text
        style={[
          styles.typeBadgeText,
          kind === "theme" && styles.typeBadgeTextTheme,
        ]}
      >
        {kind === "story" ? "Story" : "Theme"}
      </Text>
    </View>
  );

  const renderFeaturedCard = (item) => {
    const kind = item._kind === "theme" ? "theme" : "story";

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
        kind,
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
          <View style={styles.cardHeaderRow}>
            {renderTypeBadge(kind)}
            <FavoriteButton
              active={isFavorite(item)}
              onPress={() => handleFavoritePress(item)}
            />
          </View>
          {renderUpdateBadge(updatesCount(item))}
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
          "story",
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

          <View style={styles.textBlock}>
            <View style={styles.cardHeaderRow}>
              {renderTypeBadge("story")}
              <FavoriteButton
                active={isFavorite(item)}
                onPress={() => handleFavoritePress(item)}
              />
            </View>
            <Text style={styles.categoryLabel}>
              {item.category?.toUpperCase() || "GENERAL"}
            </Text>
            {item.subcategory ? (
              <Text style={styles.subcategoryLabel}>{item.subcategory}</Text>
            ) : null}
            <Text style={styles.title}>{item.title}</Text>
            {renderUpdateBadge(updatesCount(item))}
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
        "theme",
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

        <View style={styles.textBlock}>
          <View style={styles.cardHeaderRow}>
            {renderTypeBadge("theme")}
            <FavoriteButton
              active={isFavorite(item)}
              onPress={() => handleFavoritePress(item)}
            />
          </View>
          <Text style={styles.categoryLabel}>
            {item.category?.toUpperCase() || "GENERAL"}
          </Text>
          {item.subcategory ? (
            <Text style={styles.subcategoryLabel}>{item.subcategory}</Text>
          ) : null}
          <Text style={styles.title}>{item.title}</Text>
          {renderUpdateBadge(updatesCount(item))}
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
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* SUBCATEGORY ROW */}
          {activeCategory !== "All" && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subcategoryRow}
            >
              <TouchableOpacity
                onPress={() => setActiveSubcategory("All")}
                style={styles.subcategoryTextWrap}
              >
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
                  style={styles.subcategoryTextWrap}
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
  style={[styles.dropdownButton, {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  }]}
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

const createStyles = (palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    filterWrapper: {
      borderBottomWidth: 1,
      borderColor: palette.border,
      paddingVertical: 10,
      backgroundColor: palette.surface,
    },
    categoryRow: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
    },
    categoryPill: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 14,
      backgroundColor: palette.surface,
    },
    categoryPillActive: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    categoryText: { fontSize: 13, color: palette.textSecondary },
    categoryTextActive: { color: "#fff", fontWeight: "600" },
    subcategoryRow: {
      flexDirection: "row",
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    subcategoryTextWrap: {
      justifyContent: "center",
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
    featuredCard: {
      width: 240,
      marginRight: 16,
      backgroundColor: palette.surface,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: palette.border,
    },
    featuredImage: {
      width: "100%",
      height: 120,
      backgroundColor: palette.border,
    },
    featuredPlaceholder: {
      width: "100%",
      height: 120,
      backgroundColor: palette.border,
      justifyContent: "center",
      alignItems: "center",
    },
    featuredBody: {
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    featuredTypeLabel: {
      fontSize: 11,
      color: palette.muted,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    featuredTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: palette.textPrimary,
      marginBottom: 8,
    },
    dropdownButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: palette.surface,
      marginTop: 8,
      borderRadius: 8,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: palette.border,
    },
    dropdownButtonText: {
      fontSize: 14,
      color: palette.textPrimary,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
      padding: 30,
    },
    modalContent: {
      backgroundColor: palette.surface,
      borderRadius: 10,
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
    card: {
      backgroundColor: palette.surface,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: palette.border,
    },
    image: {
      width: "100%",
      height: 200,
      backgroundColor: palette.border,
    },
    placeholder: {
      height: 200,
      backgroundColor: palette.border,
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderText: { color: palette.muted },
    favoriteButton: {
      padding: 6,
    },
    updateBadge: {
      backgroundColor: "#1d4ed80f",
      borderRadius: 12,
      paddingVertical: 4,
      paddingHorizontal: 8,
      alignSelf: "flex-start",
      marginBottom: 6,
    },
    updateBadgeText: {
      fontSize: 11,
      color: palette.accent,
      fontWeight: "600",
    },
    textBlock: {
      padding: 20,
      gap: 6,
    },
    typeBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: "#DBEAFE",
      marginBottom: 6,
    },
    typeBadgeTheme: {
      backgroundColor: "#DCFCE7",
    },
    typeBadgeText: {
      fontSize: 10,
      letterSpacing: 0.5,
      color: "#1D4ED8",
      textTransform: "uppercase",
    },
    typeBadgeTextTheme: {
      color: "#166534",
    },
    categoryLabel: {
      fontSize: 12,
      color: palette.textSecondary,
      letterSpacing: 1,
      marginBottom: 4,
    },
    subcategoryLabel: {
      fontSize: 13,
      color: palette.accent,
      marginBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
      marginBottom: 6,
    },
    updatedText: {
      fontSize: 13,
      color: palette.muted,
      marginBottom: 4,
    },
    overviewPreview: {
      fontSize: 14,
      color: palette.textSecondary,
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
      color: palette.muted,
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
      backgroundColor: palette.accent,
    },
    headlineText: {
      fontSize: 13,
      color: palette.textSecondary,
      lineHeight: 18,
    },
    compactCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
      gap: 12,
    },
    compactThumbnail: {
      width: 64,
      height: 64,
      borderRadius: 12,
      backgroundColor: palette.border,
    },
    compactPlaceholder: {
      justifyContent: "center",
      alignItems: "center",
    },
    compactBody: {
      flex: 1,
      gap: 4,
    },
    compactTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 8, color: palette.textSecondary },
  });
