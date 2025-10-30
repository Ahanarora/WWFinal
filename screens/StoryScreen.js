import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";

export default function StoryScreen({ route }) {
  const { story } = route.params || {};

  if (!story) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ No story data found.</Text>
      </View>
    );
  }

  const timeline = story.timeline || [];

  return (
    <ScrollView style={styles.container}>
      {/* Cover Image */}
      {story.imageUrl ? (
        <Image source={{ uri: story.imageUrl }} style={styles.coverImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>No Cover Image</Text>
        </View>
      )}

      {/* Title / Overview */}
      <Text style={styles.title}>{story.title}</Text>
      <Text style={styles.category}>{story.category}</Text>
      <Text style={styles.overview}>{story.overview}</Text>

      {/* Timeline (with compact thumbnails) */}
      {timeline.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>🕒 Timeline</Text>
          {timeline.map((e, i) => (
            <View key={i} style={styles.eventRow}>
              {e.imageUrl ? (
                <Image source={{ uri: e.imageUrl }} style={styles.eventThumbnail} />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Text style={styles.thumbnailText}>📰</Text>
                </View>
              )}
              <View style={styles.eventTextContainer}>
                <Text style={styles.eventDate}>{e.date}</Text>
                <Text style={styles.eventTitle}>{e.event}</Text>
                <Text style={styles.eventDesc}>{e.description}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Analysis (if you add it later) */}
      {story.analysis && Object.keys(story.analysis).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>📊 Analysis</Text>
          <View style={styles.analysisBox}>
            <Text style={styles.analysisText}>{JSON.stringify(story.analysis, null, 2)}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red" },

  // Header section
  coverImage: { width: "100%", height: 220, borderRadius: 10, marginBottom: 12 },
  placeholderImage: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  placeholderText: { color: "#888", fontSize: 12 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  category: { fontSize: 14, color: "#007AFF", marginBottom: 6 },
  overview: { fontSize: 15, color: "#444", marginBottom: 20 },

  // Section headers
  sectionTitle: { fontSize: 18, fontWeight: "600", marginVertical: 10 },

  // Timeline compact style
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 8,
    marginVertical: 5,
    gap: 10,
  },
  eventThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: "#ddd",
  },
  thumbnailPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailText: { fontSize: 18 },
  eventTextContainer: { flex: 1 },
  eventDate: { color: "#777", fontSize: 12, marginBottom: 2 },
  eventTitle: { fontWeight: "600", fontSize: 14, marginBottom: 2 },
  eventDesc: { fontSize: 13, color: "#333" },

  // Analysis section
  analysisBox: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  analysisText: { fontFamily: "monospace", fontSize: 13, color: "#222" },
});
