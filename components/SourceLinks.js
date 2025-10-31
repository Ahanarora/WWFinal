// ----------------------------------------
// components/SourceLinks.js
// ----------------------------------------
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from "react-native";

/**
 * Renders a grid of clickable source cards (favicon + title)
 * @param {Array} sources - list of { title, link, imageUrl, sourceName }
 */
export default function SourceLinks({ sources = [] }) {
  // ✅ Filter out bad or empty links to prevent crash
  const validSources = sources.filter(
    (s) => s && typeof s.link === "string" && s.link.startsWith("http")
  );

  if (!validSources.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>External Coverage</Text>

      <View style={styles.grid}>
        {validSources.map((s, i) => {
          // Safe favicon fallback
          let iconUri = "https://via.placeholder.com/32";
          try {
            if (s.imageUrl && s.imageUrl.startsWith("http")) {
              iconUri = s.imageUrl;
            } else if (s.link && s.link.startsWith("http")) {
              iconUri = `${new URL(s.link).origin}/favicon.ico`;
            }
          } catch (e) {
            // keep placeholder
          }

          return (
            <TouchableOpacity
              key={i}
              style={styles.card}
              onPress={() => Linking.openURL(s.link)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: iconUri }} style={styles.icon} />
              <Text numberOfLines={2} style={styles.title}>
                {s.title || s.sourceName || "View Source"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  heading: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#1e3a8a",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: 110,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 6,
    borderRadius: 4,
    backgroundColor: "#f3f4f6",
  },
  title: {
    fontSize: 11,
    textAlign: "center",
    color: "#111827",
  },
});
