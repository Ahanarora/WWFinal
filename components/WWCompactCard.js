// components/WWCompactCard.js
// Compact universal card for Story + Theme (now uses docId + safe navigation)

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
import { getThemeColors, fonts } from "../styles/theme";

export default function WWCompactCard({ item, navigation, onPress }) {
  const { favorites, toggleFavorite, getUpdatesSinceLastVisit, themeColors } =
    useUserData();

  const palette = themeColors || getThemeColors(false);
  const styles = createStyles(palette);

  // Correct favorite state using docId
  const cardId = item.docId || item.id;
  const isFav =
    item.type === "story"
      ? favorites?.stories?.includes(cardId)
      : favorites?.themes?.includes(cardId);

  const updates = getUpdatesSinceLastVisit(item.type + "s", item);

  // Default fallback navigation
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

  const previewText =
    item.cardDescription ||
    item.card_description ||
    item.cardPreview ||
    item.card_preview ||
    item.preview ||
    item.overview ||
    "";

  return (
    <TouchableOpacity style={styles.card} onPress={pressHandler}>
      {/* Thumbnail */}
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.placeholder]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        {!!previewText && (
          <Text style={styles.preview} numberOfLines={2}>
            {previewText}
          </Text>
        )}

        {updates > 0 && (
          <Text style={styles.updateLabel}>
            {updates} update{updates > 1 ? "s" : ""} since last visit
          </Text>
        )}
      </View>

      {/* Bookmark */}
      <TouchableOpacity
        style={styles.bookmark}
        onPress={() => toggleFavorite(item.type + "s", cardId, item)}
      >
        <Ionicons
          name={isFav ? "bookmark" : "bookmark-outline"}
          size={20}
          color={isFav ? palette.accent : palette.muted}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const createStyles = (palette) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      marginTop: 12,
      marginBottom: 12,
      marginHorizontal: 16,
      backgroundColor: palette.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      gap: 12,
    },
    thumb: {
      width: 64,
      height: 64,
      borderRadius: 12,
      backgroundColor: palette.border,
    },
    placeholder: {
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderText: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: palette.muted,
    },
    body: {
      flex: 1,
      gap: 4,
    },
    preview: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: palette.textSecondary,
      marginTop: -2,
      lineHeight: 20,
    },
    title: {
      fontFamily: fonts.heading,
      fontSize: 16,
      fontWeight: "600",
      color: palette.textPrimary,
      lineHeight: 22,
    },
    updateLabel: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.accent,
      fontWeight: "500",
    },
    bookmark: {
      padding: 6,
    },
  });
