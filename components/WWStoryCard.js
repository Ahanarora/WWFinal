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
import { getThemeColors, fonts } from "../styles/theme";

export default function WWStoryCard({ item, navigation, onPress }) {
  const { favorites, toggleFavorite, getUpdatesSinceLastVisit, themeColors } =
    useUserData();

  const palette = themeColors || getThemeColors(false);
  const styles = createStyles(palette);

  // Correct: stories are favorited by their Firestore docId
  const isFav = favorites?.stories?.includes(item.docId);
  const updates = getUpdatesSinceLastVisit("stories", item);
  const headlines = getLatestHeadlines(item.timeline || []);
  const latestHeadline = headlines[0];
  const previewText =
    item.cardDescription ||
    item.card_description ||
    item.cardPreview ||
    item.card_preview ||
    item.preview ||
    item.overview ||
    "";

  const hasTopMeta = headlines.length > 0 || updates > 0;

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
      {hasTopMeta && (
        <View style={styles.topMeta}>
          {latestHeadline && (
            <View style={styles.latestWrap}>
              <Text style={styles.latestLabel}>Latest Update</Text>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletTitle}>{latestHeadline.title}</Text>
              </View>
            </View>
          )}

          {updates > 0 && (
            <Text style={styles.updatesText}>
              {updates} update{updates > 1 ? "s" : ""} since last visit
            </Text>
          )}
        </View>
      )}

      <View style={styles.imageWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Type Badge */}
        <TouchableOpacity
          style={styles.typeBadge}
          onPress={() =>
            navigation.navigate("RootTabs", { screen: "StoriesTab" })
          }
        >
          <Ionicons name="newspaper-outline" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.updated}>
            Updated {formatUpdatedAt(item.updatedAt)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={(e) => {
            e?.stopPropagation?.();
            toggleFavorite("stories", item.docId, item);
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
    </TouchableOpacity>
  );
}

const createStyles = (palette) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginTop: 16,
      paddingBottom: 14,
      backgroundColor: palette.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: "hidden",
    },
    topMeta: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
      gap: 8,
      alignItems: "flex-start",
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
      fontStyle: "italic",
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
      paddingTop: 6,
      paddingBottom: 18,
      lineHeight: 21,
    },
    imageWrap: {
      position: "relative",
      marginTop: 10,
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
      fontFamily: fonts.body,
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
      fontFamily: fonts.body,
      color: "#fff",
      fontSize: 10,
      fontWeight: "400",
    },
    updatesText: {
      marginTop: 2,
      fontSize: 12,
      color: palette.accent,
      fontWeight: "600",
      fontFamily: fonts.body,
      lineHeight: 16,
    },
    latestWrap: {
      gap: 6,
    },
    latestLabel: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: palette.muted,
      fontStyle: "italic",
    },
    bulletRow: {
      flexDirection: "row",
      gap: 8,
    },
    bulletText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: palette.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
    bulletTitle: {
      fontFamily: fonts.heading,
      fontSize: 18,
      color: palette.textPrimary,
      flex: 1,
      lineHeight: 20,
      fontStyle: "italic",
    },
    bookmark: {
      alignSelf: "flex-end",
      marginTop: 8,
    },
  });
