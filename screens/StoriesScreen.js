// ----------------------------------------
// screens/StoriesScreen.js
// Ranked Stories (no Featured blocks)
// ----------------------------------------

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { scoreContent } from "../utils/ranking";

export default function StoriesScreen({ navigation }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, "stories"));
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Rank by StoryScore (highest first)
        const ranked = [...data].sort((a, b) => scoreContent(b) - scoreContent(a));
        setStories(ranked);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading stories...</Text>
      </View>
    );
  }

  if (stories.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No stories published yet</Text>
      </View>
    );
  }

  const renderStoryCard = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("Story", {
          story: item,
          index,
          allStories: stories, // full ranked list for infinite scroll
        })
      }
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.category}>{item.category || "Uncategorized"}</Text>
        <Text style={styles.overview} numberOfLines={2}>
          {item.overview}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Stories</Text>

      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={renderStoryCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 10 },

  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginVertical: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  image: { width: "100%", height: 180 },
  placeholderImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: "#888", fontSize: 12 },

  cardContent: { padding: 12 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  category: { fontSize: 13, color: "#007AFF", marginBottom: 4 },
  overview: { fontSize: 14, color: "#555" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: "#555" },
  emptyText: { fontSize: 16, color: "#666" },
});
