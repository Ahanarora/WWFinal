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
import {
  scoreContent,
  getUpdatedAtMs,
  getPublishedAtMs,
} from "../utils/ranking";
import { formatUpdatedAt } from "../utils/formatTime";
import { getLatestHeadlines } from "../utils/getLatestHeadlines";
import { colors } from "../styles/theme";

export default function ThemesScreen({ navigation }) {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: sort mode
  const [sortMode, setSortMode] = useState("relevance");
  const [showSortMenu, setShowSortMenu] = useState(false);

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
  // SORTED THEMES
  // ----------------------------------
  const sortedThemes = useMemo(() => {
    const list = [...themes];

    if (sortMode === "updated") {
      return list.sort(
        (a, b) => (getUpdatedAtMs(b) || 0) - (getUpdatedAtMs(a) || 0)
      );
    }

    if (sortMode === "published") {
      return list.sort(
        (a, b) =>
          (getPublishedAtMs(b) || getUpdatedAtMs(b) || 0) -
          (getPublishedAtMs(a) || getUpdatedAtMs(a) || 0)
      );
    }

    // Default relevance
    return list.sort((a, b) => scoreContent(b) - scoreContent(a));
  }, [themes, sortMode]);

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
  const renderThemeCard = (theme, index) => {
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
        {theme.imageUrl && (
          <Image source={{ uri: theme.imageUrl }} style={styles.image} />
        )}

        <View style={styles.content}>
          <Text style={styles.category}>{theme.category || "General"}</Text>
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

  // SORT DROPDOWN
  dropdownButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
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
  content: { padding: 20, gap: 8 },
  category: {
    fontSize: 13,
    color: colors.accent,
    textTransform: "uppercase",
  },
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
});
