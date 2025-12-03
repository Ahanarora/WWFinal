// components/WWStoryCard.js
// Full card layout for STORY — now uses docId + proper navigation

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserData } from "../contexts/UserDataContext";
import { formatUpdatedAt } from "../utils/formatTime";
import { getLatestHeadlines } from "../utils/getLatestHeadlines";
import { getThemeColors } from "../styles/theme";

export default function WWStoryCard({ item, navigation, onPress }) {
  const { favorites, toggleFavorite, getUpdatesSinceLastVisit, themeColors } =
    useUserData();

  const palette = themeColors || getThemeColors(false);
  const styles = createStyles(palette);

  // Correct: stories are favorited by their Firestore docId
  const isFav = favorites?.stories?.includes(item.docId);
  const updates = getUpdatesSinceLastVisit("stories", item);
  const headlines = getLatestHeadlines(item.timeline || []);

  // Fallback navigation if parent does not provide onPress
  const defaultPress = () => {
    navigation.navigate("Story", {
      story: item,
      index: 0,
      allStories: [item],
    });
  };

  const pressHandler = onPress || defaultPress;

  return (
    <TouchableOpacity style={styles.card} onPress={pressHandler}>
      {/* Full-width Image */}
      <View style={styles.imageWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Type Badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>Story</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.updated}>{formatUpdatedAt(item.updatedAt)}</Text>

        {item.overview && (
          <Text style={styles.overview} numberOfLines={2}>
            {item.overview}
          </Text>
        )}

        {/* Updates Since Last Visit */}
        {updates > 0 && (
          <Text style={styles.updatesText}>
            {updates} update{updates > 1 ? "s" : ""} since last visit
          </Text>
        )}

        {/* Latest 2 bullets */}
        {headlines.length > 0 && (
          <View style={styles.latestWrap}>
            <Text style={styles.latestLabel}>Latest updates</Text>
            {headlines.slice(0, 2).map((h) => (
              <View style={styles.bulletRow} key={h.id}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{h.title}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bookmark */}
        <TouchableOpacity
          style={styles.bookmark}
          onPress={() => toggleFavorite("stories", item.docId, item)}
        >
          <Ionicons
            name={isFav ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isFav ? palette.accent : palette.muted}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (palette) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: palette.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: "hidden",
    },
    imageWrap: {
      position: "relative",
    },
    image: {
      width: "100%",
      height: 200,
    },
    imagePlaceholder: {
      width: "100%",
      height: 200,
      backgroundColor: palette.border,
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderText: {
      color: palette.muted,
    },
    typeBadge: {
      position: "absolute",
      top: 10,
      right: 10,
      backgroundColor: "#00000088",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    typeBadgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "400",
    },
    body: {
      padding: 16,
      gap: 6,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    updated: {
      fontSize: 13,
      color: palette.muted,
    },
    overview: {
      fontSize: 14,
      color: palette.textSecondary,
    },
    updatesText: {
      marginTop: 4,
      fontSize: 12,
      color: palette.accent,
      fontWeight: "600",
    },
    latestWrap: {
      marginTop: 10,
      gap: 6,
    },
    latestLabel: {
      fontSize: 11,
      textTransform: "uppercase",
      color: palette.muted,
    },
    bulletRow: {
      flexDirection: "row",
      gap: 8,
    },
    bulletDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: palette.accent,
      marginTop: 6,
    },
    bulletText: {
      fontSize: 13,
      color: palette.textSecondary,
      flex: 1,
    },
    bookmark: {
      alignSelf: "flex-end",
      marginTop: 8,
    },
  });
