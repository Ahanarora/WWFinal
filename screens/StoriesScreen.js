// ----------------------------------------
// screens/StoriesScreen.js
// Ranked Stories (no Featured blocks)
// ----------------------------------------

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { scoreContent } from "../utils/ranking";
import { formatUpdatedAt } from "../utils/formatTime";
import { getLatestHeadlines } from "../utils/getLatestHeadlines";
import { colors } from "../styles/theme";

export default function StoriesScreen({ navigation }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, "stories"));
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Rank by StoryScore (highest first)
        const ranked = [...data].sort((a, b) => scoreContent(b) - scoreContent(a));
        setStories(ranked);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading stories...</Text>
      </View>
    );
  }

  if (stories.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No stories published yet</Text>
      </View>
    );
  }

  const renderStoryCard = ({ item, index }) => {
    const headlines = getLatestHeadlines(item.timeline);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("Story", {
            story: item,
            index,
            allStories: stories, // full ranked list for infinite scroll
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Stories</Text>

      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={renderStoryCard}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },

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
    alignItems: "center",
    justifyContent: "center",
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

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: colors.textSecondary },
  emptyText: { fontSize: 16, color: colors.textSecondary },
  updated: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
  },
  headlineList: {
    gap: 6,
    marginTop: 12,
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
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 20,
  },
});
