//screens/SavedScreen.js//

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useUserData } from "../contexts/UserDataContext";
import { getThemeColors } from "../styles/theme";

export default function SavedScreen({ navigation }) {
  const { user, savedItems, savedLoading, themeColors } = useUserData();
  const palette = themeColors || getThemeColors(false);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const savedStories = savedItems?.stories || [];
  const savedThemes = savedItems?.themes || [];

  const combinedList = useMemo(
    () => [
      ...savedStories.map((item) => ({ ...item, _key: `story-${item.id}` })),
      ...savedThemes.map((item) => ({ ...item, _key: `theme-${item.id}` })),
    ],
    [savedStories, savedThemes]
  );
  const hasContent = combinedList.length > 0;

  const handleOpenItem = (item) => {
    if (item._kind === "story") {
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

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Sign in to save stories and themes.</Text>
      </View>
    );
  }

  if (savedLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.accent} />
        <Text style={styles.loadingText}>Loading your saved items...</Text>
      </View>
    );
  }

  if (!hasContent) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No saved stories or themes yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={combinedList}
      keyExtractor={(item) => item._key}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleOpenItem(item)}
        >
          <Text style={styles.typeLabel}>
            {item._kind === "story" ? "Story" : "Theme"}
          </Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.overview} numberOfLines={2}>
            {item.overview || "No summary available."}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const createStyles = (palette) =>
  StyleSheet.create({
    list: {
      padding: 16,
      gap: 12,
      backgroundColor: palette.background,
    },
    card: {
      padding: 16,
      backgroundColor: palette.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      marginBottom: 12,
    },
    typeLabel: {
      fontSize: 12,
      color: palette.muted,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
      marginBottom: 8,
    },
    overview: {
      fontSize: 14,
      color: palette.textSecondary,
      lineHeight: 20,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      backgroundColor: palette.background,
    },
    emptyText: {
      fontSize: 15,
      color: palette.textSecondary,
      textAlign: "center",
    },
    loadingText: {
      marginTop: 12,
      color: palette.textSecondary,
    },
  });
