// ----------------------------------------
// screens/HomeScreen.js
// ----------------------------------------
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { colors, spacing } from "../styles/theme";

// Categories for top filter
const CATEGORIES = [
  "All",
  "Politics",
  "Economy",
  "Environment",
  "Science & Tech",
  "Health",
  "World",
  "Culture",
  "Sports",
  "Other",
];

export default function HomeScreen({ navigation }) {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  // Fetch published themes from Firestore
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const snapshot = await getDocs(collection(db, "themes"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setThemes(data);
      } catch (err) {
        console.error("Error fetching themes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchThemes();
  }, []);

  // Filter by category
  const filteredThemes = useMemo(() => {
    if (activeCategory === "All") return themes;
    return themes.filter((t) => t.category === activeCategory);
  }, [themes, activeCategory]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent || "#2563EB"} />
        <Text style={styles.loadingText}>Loading themes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🧭 Logo Header */}
      

      {/* 🏷️ Category Filter */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => {
            const active = cat === activeCategory;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.categoryPill,
                  active && styles.categoryPillActive,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 📰 Themes List */}
      <FlatList
        data={filteredThemes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Theme", { theme: item })}
            activeOpacity={0.85}
          >
            {/* Thumbnail */}
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}

            {/* Text block */}
            <View style={styles.textBlock}>
              <Text style={styles.categoryLabel}>
                {item.category?.toUpperCase() || "GENERAL"}
              </Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.overview} numberOfLines={3}>
                {item.overview}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: spacing?.xl || 24 }}
      />
    </View>
  );
}

// ----------------------------------------
// Styles
// ----------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  // Header
  headerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing?.md || 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  logo: {
    width: 180,
    height: 55,
  },

  // Category Filter
  filterWrapper: {
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: spacing?.sm || 10,
    backgroundColor: "#fff",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing?.md || 16,
    gap: 10,
  },
  categoryPill: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#f8f8f8",
  },
  categoryPillActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  categoryText: {
    fontSize: 13,
    color: "#4B5563",
    fontFamily: "System",
  },
  categoryTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  // Theme cards
  card: {
    backgroundColor: "#fff",
    marginHorizontal: spacing?.md || 16,
    marginTop: spacing?.md || 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 200,
    backgroundColor: "#eee",
  },
  placeholder: {
    height: 200,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#999",
    fontFamily: "System",
  },
  textBlock: {
    padding: spacing?.md || 16,
  },
  categoryLabel: {
    fontSize: 12,
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: "System",
  },
  title: {
    fontFamily: "System",
    fontSize: 18,
    color: "#111827",
    marginBottom: 6,
    fontWeight: "600",
  },
  overview: {
    fontFamily: "System",
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  separator: {
    height: 16,
  },

  // Loading
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#6B7280",
    marginTop: 8,
    fontFamily: "System",
  },
});
