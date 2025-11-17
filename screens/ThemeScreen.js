// ----------------------------------------
// screens/ThemeScreen.js
// PHASE SUPPORT + EventReader integration
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

  const [feed, setFeed] = useState(theme ? [theme] : []);
  const [currentIndex, setCurrentIndex] = useState(index ?? 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [depth, setDepth] = useState(3);

  if (!theme)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠️ No theme found.</Text>
      </View>
    );

  const primaryAnalysis = normalizeAnalysis(theme.analysis);
  const hasAnyAnalysis =
    (primaryAnalysis.stakeholders?.length ?? 0) +
      (primaryAnalysis.faqs?.length ?? 0) +
      (primaryAnalysis.future?.length ?? 0) >
    0;

  // ------------------------------
  // Endless scroll
  // ------------------------------
  const loadNextTheme = () => {
    if (isLoadingMore) return;
    if (!Array.isArray(allThemes) || currentIndex >= allThemes.length - 1)
      return;

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

  // ------------------------------
  // Render one theme block
  // ------------------------------
  const renderThemeBlock = (item, isFirst) => {
    const rawTimeline = Array.isArray(item.timeline) ? item.timeline : [];

    // Add original index
    const indexedTimeline = rawTimeline.map((evt, originalIndex) => ({
      ...evt,
      _originalIndex: originalIndex,
    }));

    // Phase definitions from CMS
    const phases = Array.isArray(item.phases) ? item.phases : [];

    const getPhaseForEvent = (event) => {
      return phases.find((p) => p.startIndex === event._originalIndex) || null;
    };

    // Depth filtering
    const filteredTimeline = indexedTimeline.filter((e) => {
      if (depth === 1) return e.significance === 3;
      if (depth === 2) return e.significance >= 2;
      return true;
    });

    // EventReader modal enriched timeline
    const timelineForModal = filteredTimeline.map((evt) => {
      const ph = getPhaseForEvent(evt);
      return {
        ...evt,
        phaseTitle: ph?.title ?? null,
      };
    });

    return (
      <View key={item.id} style={{ marginBottom: 50 }}>
        {/* COVER */}
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.coverImage} />
        )}

        {/* TITLE / META */}
        <Text style={styles.title}>{item.title || "Untitled Theme"}</Text>
        <Text style={styles.updated}>{formatUpdatedAt(item.updatedAt)}</Text>
        <Text style={styles.category}>{item.category || "Uncategorized"}</Text>

        {/* OVERVIEW */}
        <View style={{ marginVertical: 10 }}>
          {renderLinkedText(item.overview, navigation)}
        </View>

        {/* ANALYSIS BUTTONS — only for first theme */}
        {isFirst && hasAnyAnalysis && (
          <View style={styles.analysisButtonsRow}>
            {primaryAnalysis.stakeholders?.length > 0 && (
              <TouchableOpacity
                style={styles.analysisButton}
                onPress={() =>
                  navigation.push("AnalysisModal", {
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
                  navigation.push("AnalysisModal", {
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
                  navigation.push("AnalysisModal", {
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

        {/* DEPTH SLIDER */}
        {!item.disableDepthToggle && isFirst && rawTimeline.length > 0 && (
          <View style={styles.sliderBox}>
            <Text style={styles.sliderLabel}>Essential</Text>
            <Slider
              style={{ flex: 1 }}
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

        {/* ------------------------------
            TIMELINE WITH PHASE HEADERS
           ------------------------------ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chronology of Events</Text>

          {filteredTimeline.length === 0 ? (
            <Text style={styles.empty}>No events for this depth.</Text>
          ) : (
            filteredTimeline.map((e, i) => {
              const phase = getPhaseForEvent(e);

              return (
                <View key={e._originalIndex ?? i} style={styles.eventBlock}>
                  {/* Phase Header */}
                  {phase && (
                    <View style={styles.phaseHeader}>
                      <Text style={styles.phaseTitle}>{phase.title}</Text>
                      {phase.description ? (
                        <Text style={styles.phaseSubtitle}>
                          {phase.description}
                        </Text>
                      ) : null}
                    </View>
                  )}

                  {/* EVENT TAPPING */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate("EventReader", {
                        events: timelineForModal,
                        startIndex: i,
                        headerTitle: item.title,
                      })
                    }
                  >
                    <View style={styles.eventRow}>
                      {e.imageUrl ? (
                        <Image
                          source={{ uri: e.imageUrl }}
                          style={styles.thumb}
                        />
                      ) : (
                        <View style={styles.thumbPlaceholder}>
                          <Text>📰</Text>
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
                  </TouchableOpacity>

                  {/* SOURCES */}
                  {Array.isArray(e.sources) && e.sources.length > 0 && (
                    <View style={styles.eventSources}>
                      <SourceLinks sources={e.sources} />
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </View>
    );
  };

  // ------------------------------
  // MAIN
  // ------------------------------
  return (
    <ScrollView
      style={styles.container}
      scrollEventThrottle={250}
      onScroll={({ nativeEvent }) => {
        const pad = 300;
        if (
          nativeEvent.layoutMeasurement.height +
            nativeEvent.contentOffset.y >=
          nativeEvent.contentSize.height - pad
        ) {
          loadNextTheme();
        }
      }}
    >
      {feed.map((t, i) => renderThemeBlock(t, i === 0))}
    </ScrollView>
  );
}

// ----------------------------------------
// STYLES
// ----------------------------------------
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
    borderRadius: 6,
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

  // ANALYSIS BUTTONS
  analysisButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  analysisButton: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderWidth: 1,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  analysisButtonText: {
    color: "#2563EB",
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },

  // SLIDER
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

  // TIMELINE
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: 4,
  },

  // PHASES
  phaseHeader: {
    marginBottom: 6,
    paddingVertical: 4,
  },
  phaseTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: "#111827",
  },
  phaseSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

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

  eventSources: {
    marginTop: 4,
    marginBottom: spacing.sm,
    paddingLeft: 2,
  },
});
