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


export default function ThemesScreen({ navigation }) {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const snapshot = await getDocs(collection(db, "themes"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Rank by StoryScore (highest first)
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

  const renderThemeCard = (theme, index) => (
    <TouchableOpacity
      key={theme.id}
      onPress={() =>
        navigation.navigate("Theme", {
          theme,
          index,
          allThemes: themes, // ranked list for infinite theme scroll
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
        <Text style={styles.updated}>{formatUpdatedAt(item.updatedAt)}</Text>

        <Text style={styles.overview} numberOfLines={3}>
          {theme.overview}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Ranked Themes */}
      {themes.map((theme, index) => renderThemeCard(theme, index))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f9fafb" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: "#555" },
  emptyText: { fontSize: 16, color: "#666" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  content: { padding: 16, gap: 8 },
  category: { fontSize: 12, color: "#6B7280", textTransform: "uppercase" },
  title: { fontSize: 18, fontWeight: "600", color: "#111" },
  overview: { fontSize: 14, color: "#444", lineHeight: 20 },
});
