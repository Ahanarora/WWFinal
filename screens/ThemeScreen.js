import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { colors, fonts, spacing } from "../styles/theme";

export default function ThemeScreen({ route }) {
  const { theme } = route.params || {};
  if (!theme)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠️ No theme found.</Text>
      </View>
    );

  const timeline = theme.timeline || [];
  const analysis = theme.analysis || {};

  return (
    <ScrollView style={styles.container}>
      {theme.imageUrl && (
        <Image source={{ uri: theme.imageUrl }} style={styles.coverImage} />
      )}

      <Text style={styles.title}>{theme.title}</Text>
      <Text style={styles.category}>{theme.category}</Text>
      <Text style={styles.overview}>{theme.overview}</Text>

      {/* TIMELINE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chronology of Events</Text>
        {timeline.length === 0 ? (
          <Text style={styles.empty}>No timeline events yet.</Text>
        ) : (
          timeline.map((e, i) => (
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
          ))
        )}
      </View>

      {/* ANALYSIS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analysis</Text>
        {Object.keys(analysis).length === 0 ? (
          <Text style={styles.empty}>No analysis yet.</Text>
        ) : (
          <View style={styles.analysisBox}>
            <Text style={styles.analysisText}>
              {JSON.stringify(analysis, null, 2)}
            </Text>
          </View>
        )}
      </View>
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
  empty: { fontFamily: fonts.body, color: "#777" },
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
  analysisBox: {
    backgroundColor: "#f3f3f3",
    padding: spacing.sm,
    borderRadius: 4,
  },
  analysisText: {
    fontFamily: "monospace",
    fontSize: 13,
    color: colors.textPrimary,
  },
});
