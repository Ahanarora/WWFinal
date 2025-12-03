// components/WWHomeCard.js
// Full-size home card for Story + Theme (supports docId + full-screen nav)

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
import { getThemeColors } from "../styles/theme";
import { formatUpdatedAt } from "../utils/formatTime";
import { getLatestHeadlines } from "../utils/getLatestHeadlines";

export default function WWHomeCard({ item, navigation, onPress }) {
  const { favorites, toggleFavorite, getUpdatesSinceLastVisit, themeColors } =
    useUserData();

  const palette = themeColors || getThemeColors(false);
  const styles = createStyles(palette);

  const isFav =
    item.type === "story"
      ? favorites?.stories?.includes(item.docId)
      : favorites?.themes?.includes(item.docId);

  const updates = getUpdatesSinceLastVisit(item.type + "s", item);
  const headlines = getLatestHeadlines(item.timeline || []);

  const defaultPress = () => {
    if (item.type === "story") {
      navigation.navigate("Story", {
        story: item,
        index: 0,
        allStories: [item],
      });
    } else {
      navigation.navigate("Theme", {
        theme: item,
        index: 0,
        allThemes: [item],
      });
    }
  };

  const pressHandler = onPress || defaultPress;

  return (
    <TouchableOpacity style={styles.card} onPress={pressHandler}>
      {/* IMAGE */}
      <View style={styles.imageWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* TYPE BADGE */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {item.type === "story" ? "Story" : "Theme"}
          </Text>
        </View>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.updated}>{formatUpdatedAt(item.updatedAt)}</Text>

        {item.overview && (
          <Text style={styles.overview} numberOfLines={2}>
            {item.overview}
          </Text>
        )}

        {updates > 0 && (
          <Text style={styles.updateBadge}>
            {updates} update{updates > 1 ? "s" : ""} since last visit
          </Text>
        )}

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

        <TouchableOpacity
          style={styles.bookmark}
          onPress={() =>
            toggleFavorite(item.type + "s", item.docId, item)
          }
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
      backgroundColor: palette.surface,
      borderRadius: 18,
      marginHorizontal: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: "hidden",
    },

    imageWrap: { position: "relative" },
    image: {
      width: "100%",
      height: 200,
    },
    placeholder: {
      width: "100%",
      height: 200,
      backgroundColor: palette.border,
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderText: {
      fontSize: 12,
      color: palette.muted,
    },

    typeBadge: {
      position: "absolute",
      top: 10,
      right: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: "#00000088",
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

    updateBadge: {
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
      marginTop: 6,
      backgroundColor: palette.accent,
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
