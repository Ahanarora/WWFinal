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
import { getThemeColors, fonts } from "../styles/theme";
import { formatUpdatedAt } from "../utils/formatTime";
import { getLatestHeadlines } from "../utils/getLatestHeadlines";

export default function WWHomeCard({ item, navigation, onPress }) {
  const { favorites, toggleFavorite, getUpdatesSinceLastVisit, themeColors } =
    useUserData();

  const palette = themeColors || getThemeColors(false);
  const styles = createStyles(palette);

  const cardType = (item.type || item._type || "").toLowerCase() || "story";
  const isStory = cardType === "story";
  const isFav = isStory
    ? favorites?.stories?.includes(item.docId)
    : favorites?.themes?.includes(item.docId);

  const updates = getUpdatesSinceLastVisit((isStory ? "story" : "theme") + "s", item);
  const headlines = getLatestHeadlines(item.timeline || []);
  const previewText =
    item.cardDescription ||
    item.card_description ||
    item.cardPreview ||
    item.card_preview ||
    item.preview ||
    item.overview ||
    "";

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
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.updated}>
            Updated on {formatUpdatedAt(item.updatedAt)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={(e) => {
            e?.stopPropagation?.();
            toggleFavorite((isStory ? "story" : "theme") + "s", item.docId, item);
          }}
        >
          <Ionicons
            name={isFav ? "bookmark" : "bookmark-outline"}
            size={26}
            color={isFav ? palette.accent : palette.muted}
          />
        </TouchableOpacity>
      </View>

      {!!previewText && (
        <Text style={styles.overview} numberOfLines={2}>
          {previewText}
        </Text>
      )}

      <View style={styles.imageWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.typeIconBadge}
          onPress={() =>
            navigation.navigate("RootTabs", {
              screen: isStory ? "StoriesTab" : "ThemesTab",
            })
          }
        >
          <Ionicons
            name={isStory ? "newspaper-outline" : "compass-outline"}
            size={16}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

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
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 14,
    },
    headerTextWrap: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontFamily: fonts.heading,
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
      lineHeight: 24,
    },
    updated: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.muted,
    },
    saveButton: {
      padding: 8,
      borderRadius: 12,
    },
    overview: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: palette.textSecondary,
      paddingHorizontal: 16,
      paddingTop: 4,
      lineHeight: 21,
    },

    imageWrap: { position: "relative", marginTop: 10 },
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
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.muted,
    },
    typeIconBadge: {
      position: "absolute",
      top: 10,
      right: 10,
      padding: 6,
      backgroundColor: "#00000088",
      borderRadius: 12,
    },

    updateBadge: {
      marginTop: 8,
      paddingHorizontal: 16,
      fontSize: 12,
      color: palette.accent,
      fontWeight: "600",
      fontFamily: fonts.body,
    },

    latestWrap: {
      marginTop: 10,
      gap: 6,
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    latestLabel: {
      fontFamily: fonts.body,
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
      fontFamily: fonts.body,
      fontSize: 13,
      color: palette.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
  });
