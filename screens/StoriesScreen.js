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
import { colors } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";


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
      <Text style={styles.compactTitle} numberOfLines={2}>
        {item.title}
      </Text>
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
          <Text style={styles.title}>{item.title}</Text>
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
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },

  header: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },

  // DROPDOWN BUTTON
  dropdownButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    marginBottom: 12,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#000",
  },

  // MODAL
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 30,
  },
  modalContent: {
    backgroundColor: "#fff",
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
    color: "#333",
  },
  selectedOptionText: {
    fontWeight: "bold",
    color: colors.accent,
  },

  // STORY CARDS
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginVertical: 10,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },

  image: { width: "100%", height: 200, backgroundColor: "#e2e8f0" },
  placeholderImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: colors.muted, fontSize: 12 },

  cardContent: { padding: 20, gap: 6 },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  category: {
    fontSize: 13,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  updated: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
  },

  // Headlines
  headlineList: { gap: 6, marginTop: 12 },
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
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 20,
  },

  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginVertical: 10,
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

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: colors.textSecondary },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
