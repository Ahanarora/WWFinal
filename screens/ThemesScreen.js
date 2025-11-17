// ----------------------------------------
// screens/ThemesScreen.js
// Ranked Themes (no Featured blocks)
// ----------------------------------------

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { scoreContent } from "../utils/ranking";
import { formatUpdatedAt } from "../utils/formatTime";
import { getLatestHeadlines } from "../utils/getLatestHeadlines";
import { colors } from "../styles/theme";

export default function ThemesScreen({ navigation }) {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const snapshot = await getDocs(collection(db, "themes"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const ranked = [...data].sort((a, b) => scoreContent(b) - scoreContent(a));
        setThemes(ranked);
      } catch (err) {
        console.error("Error fetching themes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchThemes();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading themes...</Text>
      </View>
    );
  }

  if (themes.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No themes available yet.</Text>
      </View>
    );
  }

  const renderThemeCard = (theme, index) => {
    const headlines = getLatestHeadlines(theme.timeline);
    return (
      <TouchableOpacity
        key={theme.id}
        onPress={() =>
          navigation.navigate("Theme", {
            theme,
            index,
            allThemes: themes,
          })
        }
        style={styles.card}
      >
        {theme.imageUrl && (
          <Image source={{ uri: theme.imageUrl }} style={styles.image} />
        )}

        <View style={styles.content}>
          <Text style={styles.category}>{theme.category || "General"}</Text>
          <Text style={styles.title}>{theme.title}</Text>
          <Text style={styles.updated}>{formatUpdatedAt(theme.updatedAt)}</Text>

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
          {theme.overview ? (
            <Text style={styles.overviewPreview} numberOfLines={2}>
              {theme.overview}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {themes.map((theme, index) => renderThemeCard(theme, index))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.background },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: colors.textSecondary },
  emptyText: { fontSize: 16, color: colors.textSecondary },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 22,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    backgroundColor: "#e2e8f0",
  },
  content: { padding: 20, gap: 8 },
  category: {
    fontSize: 13,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  updated: {
    fontSize: 13,
    color: colors.muted,
  },
  headlineList: {
    gap: 6,
    marginTop: 6,
  },
  latestLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headlineRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  headlineBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: colors.accent,
  },
  headlineText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  overviewPreview: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
});
