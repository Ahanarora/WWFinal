import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { colors, fonts, spacing } from "../styles/theme";

export default function StoryScreen({ route }) {
  const { story } = route.params || {};
  if (!story)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠️ No story found.</Text>
      </View>
    );

  const timeline = story.timeline || [];

  return (
    <ScrollView style={styles.container}>
      {story.imageUrl && (
        <Image source={{ uri: story.imageUrl }} style={styles.coverImage} />
      )}
      <Text style={styles.title}>{story.title}</Text>
      <Text style={styles.category}>{story.category}</Text>
      <Text style={styles.overview}>{story.overview}</Text>

      {timeline.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {timeline.map((e, i) => (
            <View key={i} style={styles.eventRow}>
              {e.imageUrl ? (
                <Image source={{ uri: e.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Text style={{ fontSize: 16 }}>📰</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.eventDate}>{e.date}</Text>
                <Text style={styles.eventTitle}>{e.event}</Text>
                <Text style={styles.eventDesc}>{e.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "red" },
  coverImage: {
    width: "100%",
    height: 240,
    borderRadius: 4,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  category: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  overview: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: 4,
  },
  eventRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  thumbPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  eventDate: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#777",
  },
  eventTitle: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.textPrimary,
  },
  eventDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
