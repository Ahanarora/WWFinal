// components/WWCompactCard.js
// Compact universal card for Story + Theme

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

export default function WWCompactCard({ item, navigation }) {
  const { favorites, toggleFavorite, getUpdatesSinceLastVisit, themeColors } =
    useUserData();

  const palette = themeColors || getThemeColors(false);
  const styles = createStyles(palette);

  const isFav =
    item.type === "story"
      ? favorites?.stories?.includes(item.id)
      : favorites?.themes?.includes(item.id);

  const updates = getUpdatesSinceLastVisit(item.type + "s", item);

  const onPress = () => {
    if (item.type === "story") {
      navigation.navigate("Story", {
        storyId: item.id,
      });
    } else {
      navigation.navigate("Theme", {
        theme: item,
      });
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
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

        {updates > 0 && (
          <Text style={styles.updateLabel}>
            {updates} update{updates > 1 ? "s" : ""} since last visit
          </Text>
        )}
      </View>

      {/* Save icon */}
      <TouchableOpacity
        style={styles.bookmark}
        onPress={() => {
          toggleFavorite(item.type + "s", item.id, item);
        }}
      >
        <Ionicons
          name={isFav ? "bookmark" : "bookmark-outline"}
          size={18}
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
      marginVertical: 10,
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
      fontSize: 11,
      color: palette.muted,
    },
    body: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    updateLabel: {
      fontSize: 12,
      color: palette.accent,
      fontWeight: "500",
    },
    bookmark: {
      padding: 6,
    },
  });
