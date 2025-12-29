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
import ScreenLayout from "../components/ScreenLayout";

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

  let content = null;

  if (!user) {
    content = (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Sign in to save stories and themes.</Text>
        <Text style={styles.emptySubtitle}>
          Tap the bookmark icon to keep items here.
        </Text>
      </View>
    );
  } else if (savedLoading) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.accent} />
        <Text style={styles.loadingText}>Loading your saved items...</Text>
      </View>
    );
  } else if (!hasContent) {
    content = (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>You haven’t saved anything yet.</Text>
        <Text style={styles.emptySubtitle}>
          Tap the bookmark icon to save stories.
        </Text>
      </View>
    );
  } else {
    content = (
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

  return <ScreenLayout>{content}</ScreenLayout>;
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
    loadingText: {
      marginTop: 12,
      color: palette.textSecondary,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      backgroundColor: palette.background,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      backgroundColor: palette.background,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
      textAlign: "center",
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 14,
      color: palette.textSecondary,
      textAlign: "center",
    },
  });
