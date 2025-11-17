// ----------------------------------------
// screens/ThemeScreen.js
// ----------------------------------------
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import Slider from "@react-native-community/slider";
import { colors, fonts, spacing } from "../styles/theme";
import SourceLinks from "../components/SourceLinks";
import RenderWithContext from "../components/RenderWithContext";
import { renderLinkedText } from "../utils/renderLinkedText";
import { formatUpdatedAt } from "../utils/formatTime";
import { normalizeAnalysis } from "../utils/normalizeAnalysis";

export default function ThemeScreen({ route, navigation }) {
  const { theme, index, allThemes } = route.params || {};

  // Endless scroll state
  const [feed, setFeed] = useState(theme ? [theme] : []);
  const [currentIndex, setCurrentIndex] = useState(index ?? 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Depth toggle state (KEEP ONLY ONCE)
  const [depth, setDepth] = useState(3);

  if (!theme)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠️ No theme found.</Text>
      </View>
    );

  const primaryAnalysis = normalizeAnalysis(theme.analysis);
  const hasAnyAnalysis =
    primaryAnalysis &&
    ((primaryAnalysis.stakeholders?.length || 0) +
      (primaryAnalysis.faqs?.length || 0) +
      (primaryAnalysis.future?.length || 0) >
      0);

  // ----- ENDLESS SCROLL LOADER -----
  const loadNextTheme = () => {
    if (isLoadingMore) return;
    if (!Array.isArray(allThemes) || currentIndex >= allThemes.length - 1) return;

    setIsLoadingMore(true);

    const nextIndex = currentIndex + 1;
    const nextTheme = allThemes[nextIndex];

    if (!nextTheme) {
      setIsLoadingMore(false);
      return;
    }

    if (feed.some((t) => t.id === nextTheme.id)) {
      setIsLoadingMore(false);
      return;
    }

    setFeed((prev) => [...prev, nextTheme]);
    setCurrentIndex(nextIndex);
    setIsLoadingMore(false);
  };

  // ----- RENDER A SINGLE THEME BLOCK -----
  const renderThemeBlock = (item, isFirst) => {
    const timeline = Array.isArray(item.timeline) ? item.timeline : [];

    const filteredTimeline = timeline.filter((e) => {
      if (depth === 1) return e.significance === 3;
      if (depth === 2) return e.significance >= 2;
      return true;
    });

    return (
      <View key={item.id} style={{ marginBottom: 50 }}>
        {/* Cover */}
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.coverImage} />
        )}

        {/* Metadata */}
        <Text style={styles.title}>{item.title || "Untitled Theme"}</Text>
        <Text style={styles.updated}>{formatUpdatedAt(item.updatedAt)}</Text>
        <Text style={styles.category}>{item.category || "Uncategorized"}</Text>

        {/* Overview */}
        <View style={{ marginVertical: 10 }}>
          {renderLinkedText(item.overview, navigation)}
        </View>

        {/* 🔵 NEW: ANALYSIS BUTTONS (only for first/primary theme) */}
        {isFirst && hasAnyAnalysis && (
          <View style={styles.analysisButtonsRow}>
            {primaryAnalysis.stakeholders?.length > 0 && (
              <TouchableOpacity
                style={styles.analysisButton}
                onPress={() =>
                  navigation.navigate("AnalysisModal", {
                    type: "stakeholders",
                    analysis: primaryAnalysis,
                  })
                }
              >
                <Text style={styles.analysisButtonText}>Stakeholders</Text>
              </TouchableOpacity>
            )}

            {primaryAnalysis.faqs?.length > 0 && (
              <TouchableOpacity
                style={styles.analysisButton}
                onPress={() =>
                  navigation.navigate("AnalysisModal", {
                    type: "faqs",
                    analysis: primaryAnalysis,
                  })
                }
              >
                <Text style={styles.analysisButtonText}>FAQs</Text>
              </TouchableOpacity>
            )}

            {primaryAnalysis.future?.length > 0 && (
              <TouchableOpacity
                style={styles.analysisButton}
                onPress={() =>
                  navigation.navigate("AnalysisModal", {
                    type: "future",
                    analysis: primaryAnalysis,
                  })
                }
              >
                <Text style={styles.analysisButtonText}>Future Qs</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Depth Toggle → ONLY FOR FIRST THEME */}
        {!item.disableDepthToggle && isFirst && timeline.length > 0 && (
          <View style={styles.sliderBox}>
            <Text style={styles.sliderLabel}>Essential</Text>
            <Slider
              style={{ flex: 1, height: 40 }}
              minimumValue={1}
              maximumValue={3}
              step={1}
              value={depth}
              onValueChange={(v) => setDepth(v)}
              minimumTrackTintColor="#2563EB"
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor="#2563EB"
            />
            <Text style={styles.sliderLabel}>Complete</Text>
          </View>
        )}

        {/* TIMELINE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chronology of Events</Text>

          {filteredTimeline.length === 0 ? (
            <Text style={styles.empty}>No events for this depth.</Text>
          ) : (
            filteredTimeline.map((e, i) => (
              <View key={i} style={styles.eventBlock}>
                {/* Event Row */}
                <View style={styles.eventRow}>
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
                    <RenderWithContext
                      text={e.description}
                      contexts={e.contexts || []}
                      navigation={navigation}
                    />
                  </View>
                </View>

                {/* Event-specific coverage links */}
                {Array.isArray(e.sources) && e.sources.length > 0 && (
                  <View style={styles.eventSources}>
                    <SourceLinks sources={e.sources} />
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  // ----- MAIN RETURN -----
  return (
    <ScrollView
      style={styles.container}
      onScroll={({ nativeEvent }) => {
        const paddingToBottom = 300;
        if (
          nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
          nativeEvent.contentSize.height - paddingToBottom
        ) {
          loadNextTheme();
        }
      }}
      scrollEventThrottle={250}
    >
      {feed.map((t, i) => renderThemeBlock(t, i === 0))}
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
  updated: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "#6B7280",
    marginBottom: spacing.md,
  },
  overview: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  // 🔵 Analysis buttons
  analysisButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: spacing.md,
  },
  analysisButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  analysisButtonText: {
    color: "#F9FAFB",
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: "500",
  },
  sliderBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  sliderLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    width: 60,
    textAlign: "center",
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
  eventBlock: {
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: spacing.sm,
  },
  eventRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: spacing.sm,
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
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "400",
  },
  eventDesc: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  eventSources: {
    marginTop: 4,
    marginBottom: spacing.sm,
    paddingLeft: 2,
  },
});
