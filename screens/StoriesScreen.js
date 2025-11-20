// ----------------------------------------
// screens/StoriesScreen.js
// Custom dropdown (Web-safe) + Sorting
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


/**
 * ⭐ Safe timestamp normalizer for sorting.
 * PRIORITY:
 * 1) createdAt     → for Published sort
 * 2) publishedAt   → fallback
 * 3) updatedAt     → for Updated sort
 */
const safeTimestamp = (item) => {
  if (!item) return 0;

  const t = item.createdAt || item.publishedAt || item.updatedAt;
  if (!t) return 0;

  // Firestore Timestamp
  if (typeof t.toDate === "function") return t.toDate().getTime();
  if (t.seconds) return t.seconds * 1000;

  // String / JS Date fallback
  const d = new Date(t);
  return isNaN(d) ? 0 : d.getTime();
};

/** Only createdAt for RECENTLY PUBLISHED */
const getCreatedAtMs = (item) => {
  const t = item.createdAt;
  if (!t) return 0;

  if (typeof t.toDate === "function") return t.toDate().getTime();
  if (t.seconds) return t.seconds * 1000;

  const d = new Date(t);
  return isNaN(d) ? 0 : d.getTime();
};

export default function StoriesScreen({ navigation }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: sort mode
  const [sortMode, setSortMode] = useState("relevance");

  // Dropdown modal
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

  // -----------------------------
  // FETCH STORIES
  // -----------------------------
  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, "stories"));
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStories(data);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // -----------------------------
  // SORTED STORIES
  // -----------------------------
  const sortedStories = useMemo(() => {
    const list = [...stories];

    // 🔥 Recently Updated — uses updatedAt
    if (sortMode === "updated") {
      return list.sort(
        (a, b) =>
          safeTimestamp({ updatedAt: b.updatedAt }) -
          safeTimestamp({ updatedAt: a.updatedAt })
      );
    }

    // 🔥 Recently Published — MUST use createdAt ONLY
    if (sortMode === "published") {
      return list.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
    }

    // 🔥 Relevance (velocity + recency)
    return list.sort((a, b) => scoreContent(b) - scoreContent(a));
  }, [stories, sortMode]);

  // -----------------------------
  // RENDER STORY CARD
  // -----------------------------
  const isFavorite = (id) => favorites?.stories?.includes(id);

  const handleFavorite = (item) => {
    if (!user) {
      alert("Sign in to save stories.");
      return;
    }
    toggleFavorite("stories", item.id, item);
  };

  const updatesCount = (item) =>
    getUpdatesSinceLastVisit("stories", item);

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

  const renderCompactStoryCard = (item, index) => (
    <TouchableOpacity
      style={styles.compactCard}
      onPress={() =>
        navigation.navigate("Story", {
          story: item,
          index,
          allStories: sortedStories,
        })
      }
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.compactThumbnail} />
      ) : (
        <View style={[styles.compactThumbnail, styles.compactPlaceholder]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.compactTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {renderUpdateBadge(updatesCount(item))}
      </View>
      <FavoriteButton
        active={isFavorite(item.id)}
        onPress={() => handleFavorite(item)}
      />
    </TouchableOpacity>
  );

  const renderStoryCard = ({ item, index }) => {
    if (item.isCompactCard) {
      return renderCompactStoryCard(item, index);
    }

    const headlines = getLatestHeadlines(item.timeline);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("Story", {
            story: item,
            index,
            allStories: sortedStories,
          })
        }
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.category}>{item.category || "Uncategorized"}</Text>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.title}>{item.title}</Text>
            <FavoriteButton
              active={isFavorite(item.id)}
              onPress={() => handleFavorite(item)}
            />
          </View>
          {renderUpdateBadge(updatesCount(item))}
          <Text style={styles.updated}>{formatUpdatedAt(item.updatedAt)}</Text>

          {item.overview ? (
            <Text style={styles.overviewPreview} numberOfLines={2}>
              {item.overview}
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

  // -----------------------------
  // UI
  // -----------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading stories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Stories</Text>

      {/* ---------- SORT DROPDOWN ---------- */}
      {/* SORT BUTTON WITH ARROW */}
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
  />
</TouchableOpacity>

      {/* ---------- SORT MENU MODAL ---------- */}
      <Modal
        visible={showSortMenu}
        transparent
        animationType="fade"
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

      {/* ---------- STORY LIST ---------- */}
      <FlatList
        data={sortedStories}
        keyExtractor={(item) => item.id}
        renderItem={renderStoryCard}
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
      padding: 16,
      backgroundColor: palette.background,
    },
    header: {
      fontSize: 24,
      fontWeight: "700",
      color: palette.textPrimary,
      marginBottom: 12,
    },
    dropdownButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: palette.surface,
      borderRadius: 8,
      marginBottom: 12,
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
      paddingVertical: 5,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 10,
    },
    modalOption: {
      paddingVertical: 12,
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
      borderRadius: 18,
      marginVertical: 10,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: palette.border,
      elevation: 3,
    },
    image: { width: "100%", height: 200, backgroundColor: palette.border },
    placeholderImage: {
      width: "100%",
      height: 200,
      backgroundColor: palette.border,
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderText: { color: palette.muted, fontSize: 12 },
    cardContent: { padding: 20, gap: 6 },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    category: {
      fontSize: 13,
      color: palette.accent,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    updated: {
      fontSize: 13,
      color: palette.muted,
      marginBottom: 4,
    },
    headlineList: { gap: 6, marginTop: 12 },
    latestLabel: {
      fontSize: 11,
      color: palette.muted,
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
      backgroundColor: palette.accent,
    },
    headlineText: {
      fontSize: 13,
      color: palette.textSecondary,
      fontWeight: "500",
      lineHeight: 18,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    favoriteButton: {
      padding: 6,
    },
    updateBadge: {
      backgroundColor: `${palette.accent}1A`,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignSelf: "flex-start",
      marginBottom: 6,
    },
    updateBadgeText: {
      fontSize: 11,
      color: palette.accent,
      fontWeight: "600",
    },
    overviewPreview: {
      fontSize: 14,
      color: palette.textSecondary,
      marginTop: 2,
      lineHeight: 20,
    },
    compactCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 16,
      marginVertical: 10,
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
    compactTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: palette.background,
    },
    loadingText: { marginTop: 8, color: palette.textSecondary },
    emptyText: { fontSize: 16, color: palette.textSecondary },
  });
