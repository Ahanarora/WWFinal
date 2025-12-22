// components/WWThemeCard.js
// Full Theme card — now uses docId + safe nav

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

export default function WWThemeCard({ item, navigation, onPress }) {
  const { favorites, toggleFavorite, getUpdatesSinceLastVisit, themeColors } =
    useUserData();

  const palette = themeColors || getThemeColors(false);
  const styles = createStyles(palette);

  const isFav = favorites?.themes?.includes(item.docId);
  const updates = getUpdatesSinceLastVisit("themes", item);
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

  const defaultPress = () => {
    navigation.navigate("Theme", {
      theme: item,
      index: 0,
      allThemes: [item],
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

        {/* TYPE BADGE */}
        <TouchableOpacity
          style={styles.typeBadge}
          onPress={() =>
            navigation.navigate("RootTabs", { screen: "ThemesTab" })
          }
        >
          <Ionicons name="compass-outline" size={16} color="#fff" />
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
            toggleFavorite("themes", item.docId, item);
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
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    updated: { fontSize: 12, color: palette.muted },
    saveButton: {
      padding: 8,
      borderRadius: 12,
    },
    overview: {
      fontSize: 14,
      color: palette.textSecondary,
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 14,
    },

    imageWrap: { position: "relative", marginTop: 10 },
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
    placeholderText: { color: palette.muted },

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

    updatesText: {
      marginTop: 2,
      fontSize: 12,
      color: palette.accent,
      fontWeight: "600",
      lineHeight: 16,
    },
    latestWrap: {
      gap: 6,
    },
    latestLabel: { fontSize: 11, color: palette.muted },
    bulletRow: { flexDirection: "row", gap: 8 },
    bulletTitle: {
      fontSize: 18,
      color: palette.textPrimary,
      flex: 1,
      fontFamily: "System",
    },
  });
