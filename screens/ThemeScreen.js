// ----------------------------------------
// screens/ThemeScreen.js
// PHASE SUPPORT + EventReader integration
// ----------------------------------------
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
} from "react-native";
import Slider from "@react-native-community/slider";
import { colors, fonts, spacing } from "../styles/theme";
import SourceLinks from "../components/SourceLinks";
import RenderWithContext from "../components/RenderWithContext";
import {
  formatUpdatedAt,
  formatDateLongOrdinal,
} from "../utils/formatTime";
import { normalizeAnalysis } from "../utils/normalizeAnalysis";
import { useUserData } from "../contexts/UserDataContext";
import { Ionicons } from "@expo/vector-icons";
import CommentsSection from "../components/CommentsSection";
import { getStorySearchCache } from "../utils/storyCache";
import ShareButton from "../components/ShareButton";
import { shareItem } from "../utils/share";
import EventSortToggle from "../components/EventSortToggle";

const PHASE_PALETTE = [
  "#EF4444", // red
  "#3B82F6", // blue
  "#FACC15", // yellow
  "#22C55E", // green
  "#F97316", // orange
  "#A855F7", // purple
  "#14B8A6", // teal
  "#EC4899", // pink
  "#6366F1", // indigo
];

function getFactCheckRgb(score) {
  if (score >= 85) return { bg: "#E9F9D0", text: "#3F6212" };
  if (score >= 70) return { bg: "#FEF9C3", text: "#854D0E" };
  if (score >= 50) return { bg: "#FFEDD5", text: "#9A3412" };
  return { bg: "#FEE2E2", text: "#991B1B" };
}

export default function ThemeScreen({ route, navigation }) {
  const { theme, index, allThemes } = route.params || {};

  const [feed, setFeed] = useState(theme ? [theme] : []);
  const [currentIndex, setCurrentIndex] = useState(index ?? 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [depth, setDepth] = useState(2);
  const [sortOrder, setSortOrder] = useState("chronological");
  const {
    user,
    favorites,
    toggleFavorite,
    getUpdatesSinceLastVisit,
    recordVisit,
  } = useUserData();
  const [factCheckModal, setFactCheckModal] = useState({
    visible: false,
    factCheck: null,
  });
  const headerShownRef = useRef(true);
  const lastOffsetY = useRef(0);

  const toggleHeader = useCallback(
    (show) => {
      if (!navigation?.getParent) return;
      if (headerShownRef.current === show) return;
      navigation.getParent()?.setOptions({ headerShown: show });
      headerShownRef.current = show;
    },
    [navigation]
  );

  const handleHeaderScroll = useCallback(
    ({ nativeEvent }) => {
      const y = nativeEvent?.contentOffset?.y || 0;
      const delta = y - lastOffsetY.current;
      const threshold = 20;
      if (delta > threshold) toggleHeader(false);
      else if (delta < -threshold) toggleHeader(true);
      lastOffsetY.current = y;
    },
    [toggleHeader]
  );

  useEffect(() => () => toggleHeader(true), [toggleHeader]);

  if (!theme)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠️ No theme found.</Text>
      </View>
    );

  const primaryAnalysis = normalizeAnalysis(theme.analysis);
  const primaryContexts = [
    ...(theme.contexts || []),
    ...(primaryAnalysis?.contexts || []),
  ];
  const isFavorite = (id) => favorites?.themes?.includes(id);
  const handleFavorite = (item) => {
    if (!user) {
      alert("Sign in to save themes.");
      return;
    }
    toggleFavorite("themes", item.id, {
      ...item,
      _kind: "theme",
    });
  };
  const updatesCount = (item) =>
    getUpdatesSinceLastVisit("themes", item);

  const renderUpdateBadge = (count) =>
    count > 0 ? (
      <View style={styles.updateBadge}>
        <Text style={styles.updateBadgeText}>
          {count} update{count > 1 ? "s" : ""} since you visited
        </Text>
      </View>
    ) : null;
  const hasAnyAnalysis =
    (primaryAnalysis.stakeholders?.length ?? 0) +
      (primaryAnalysis.faqs?.length ?? 0) +
      (primaryAnalysis.future?.length ?? 0) >
    0;

  useEffect(() => {
    if (theme?.id) {
      recordVisit("themes", theme.id);
    }
  }, [theme?.id, recordVisit]);

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
    const sortEvents = (events) => {
      if (!Array.isArray(events)) return [];
      const copy = [...events];
      return copy.sort((a, b) => {
        const aTime = a.timestamp || a.date || a.startedAt;
        const bTime = b.timestamp || b.date || b.startedAt;
        if (!aTime || !bTime) return 0;
        const aMs = typeof aTime === "number" ? aTime : new Date(aTime).getTime();
        const bMs = typeof bTime === "number" ? bTime : new Date(bTime).getTime();
        if (Number.isNaN(aMs) || Number.isNaN(bMs)) return 0;
        return sortOrder === "chronological" ? aMs - bMs : bMs - aMs;
      });
    };

    const rawTimeline = sortEvents(item.timeline);
    const analysisForItem =
      item.id === theme.id ? primaryAnalysis : normalizeAnalysis(item.analysis);
    const combinedContexts = [
      ...(item.contexts || []),
      ...(analysisForItem?.contexts || []),
    ];

    // Add original index
    const indexedTimeline = rawTimeline.map((evt, originalIndex) => ({
      ...evt,
      _originalIndex: originalIndex,
    }));

    // Phase definitions from CMS
    const rawPhases = Array.isArray(item.phases) ? item.phases : [];
    const timelineLength = indexedTimeline.length;
    const phasesWithAccent = rawPhases.map((phase, idx) => {
      // CMS can now optionally send phase.endIndex to mark where the phase ends.
      const accentColor =
        phase?.accentColor ||
        phase?.color ||
        PHASE_PALETTE[idx % PHASE_PALETTE.length];

      const nextStart = rawPhases[idx + 1]?.startIndex;
      const fallbackEnd =
        typeof nextStart === "number" ? nextStart - 1 : timelineLength - 1;
      const providedEnd =
        typeof phase?.endIndex === "number" ? phase.endIndex : undefined;

      const safeStart = Math.max(0, phase?.startIndex ?? 0);
      const safeEnd = Math.max(
        safeStart,
        Math.min(timelineLength - 1, providedEnd ?? fallbackEnd ?? safeStart)
      );

      return {
        ...phase,
        accentColor,
        startIndex: safeStart,
        endIndex: safeEnd,
      };
    });

    const phaseStartLookup = phasesWithAccent.reduce((acc, phase) => {
      if (typeof phase?.startIndex === "number") {
        acc[phase.startIndex] = phase;
      }
      return acc;
    }, {});

    const phaseRangeLookup = phasesWithAccent.reduce((acc, phase) => {
      if (
        typeof phase?.startIndex === "number" &&
        typeof phase?.endIndex === "number"
      ) {
        for (let idx = phase.startIndex; idx <= phase.endIndex; idx += 1) {
          acc[idx] = phase;
        }
      }
      return acc;
    }, {});

    const getPhaseForEvent = (event) => {
      if (!phasesWithAccent.length) return null;
      return phaseStartLookup[event._originalIndex] || null;
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
      <View key={item.id} style={{ marginBottom: 0 }}>
        {/* COVER */}
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.coverImage} />
        )}

        {/* TITLE / META */}
        <View style={styles.themeHeaderRow}>
          <Text style={styles.title}>{item.title || "Untitled Theme"}</Text>
          <View style={styles.themeActions}>
            <ShareButton
              onPress={() =>
                shareItem({
                  type: "theme",
                  id: item.id,
                  title: item.title,
                })
              }
            />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleFavorite(item)}
            >
              <Ionicons
                name={isFavorite(item.id) ? "bookmark" : "bookmark-outline"}
                size={24}
                color={isFavorite(item.id) ? "#FACC15" : colors.muted}
              />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.updated}>{formatUpdatedAt(item.updatedAt)}</Text>
        <TouchableOpacity
          onPress={() =>
            item.category &&
            navigation.navigate("Search", {
              stories: getStorySearchCache(),
              initialQuery: item.category,
            })
          }
          disabled={!item.category}
        >
          <Text style={styles.category}>{item.category || "Uncategorized"}</Text>
        </TouchableOpacity>

        {/* OVERVIEW */}
        {item.overview ? (
          <View style={styles.overviewBlock}>
            <RenderWithContext
              text={item.overview}
              contexts={combinedContexts}
              navigation={navigation}
            />
            {renderUpdateBadge(updatesCount(item))}
          </View>
        ) : null}

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
                    contexts: primaryContexts,
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
                    contexts: primaryContexts,
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
                    contexts: primaryContexts,
                  })
                }
              >
                <Text style={styles.analysisButtonText}>Future?</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* DEPTH SLIDER */}
        {!item.disableDepthToggle && isFirst && rawTimeline.length > 0 && (
          <View style={styles.sliderBox}>
            <Text style={styles.sliderLabel}>Essential</Text>
            <View style={styles.sliderTrackWrap}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={3}
                step={1}
                value={depth}
                onValueChange={(v) => setDepth(v)}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor="#6B7280"
                thumbTintColor={colors.accent}
              />
            </View>
            <Text style={styles.sliderLabel}>Complete</Text>
          </View>
        )}

        {/* ------------------------------
            TIMELINE WITH PHASE HEADERS
           ------------------------------ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            {rawTimeline.length > 0 && isFirst && (
              <EventSortToggle sortOrder={sortOrder} onChange={setSortOrder} />
            )}
          </View>

          {filteredTimeline.length === 0 ? (
            <Text style={styles.empty}>No events for this depth.</Text>
          ) : (
            filteredTimeline.map((e, i) => {
              const phase = getPhaseForEvent(e);
              const activePhase = phaseRangeLookup[e._originalIndex];
              const isPhaseEnd =
                activePhase && activePhase.endIndex === e._originalIndex;
              const hasFactCheck =
                !!e.factCheck &&
                typeof e.factCheck.confidenceScore === "number" &&
                !Number.isNaN(e.factCheck.confidenceScore);
              const factCheckColors = hasFactCheck
                ? getFactCheckRgb(e.factCheck.confidenceScore)
                : null;

              return (
                <View key={e._originalIndex ?? i} style={styles.eventBlock}>
                  {/* Phase Header */}
                  {phase && (
                    <View
                      style={[
                        styles.phaseHeader,
                        { borderLeftColor: phase.accentColor },
                      ]}
                    >
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
                    <View
                      style={[
                        styles.eventCard,
                        activePhase && {
                          borderLeftWidth: 3,
                          borderLeftColor: activePhase.accentColor,
                          paddingLeft: spacing.md - 3,
                        },
                      ]}
                    >
                      {e.imageUrl || e.image || e.thumbnail ? (
                        <Image
                          source={{
                            uri: e.imageUrl || e.image || e.thumbnail,
                          }}
                          style={styles.eventImage}
                        />
                      ) : (
                        <View style={styles.eventImagePlaceholder}>
                          <Text style={styles.eventImageEmoji}>📰</Text>
                        </View>
                      )}

                      <View style={styles.eventContent}>
                        <Text style={styles.eventDate}>
                          {formatDateLongOrdinal(e.date)}
                        </Text>
                        <Text style={styles.eventTitle}>{e.event}</Text>
                        <RenderWithContext
                          text={e.description}
                          contexts={e.contexts || []}
                          navigation={navigation}
                        />
                        {hasFactCheck && (
                          <View style={styles.factCheckContainer}>
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() =>
                                setFactCheckModal({
                                  visible: true,
                                  factCheck: e.factCheck,
                                })
                              }
                            >
                              <Text
                              style={[
                                styles.factCheckBadge,
                                {
                                  backgroundColor: "#fff",
                                  color: factCheckColors.text,
                                  borderColor: factCheckColors.text,
                                },
                              ]}
                            >
                                {e.factCheck.confidenceScore}% fact-check confidence
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        {Array.isArray(e.sources) && e.sources.length > 0 && (
                          <View style={styles.eventSources}>
                            <SourceLinks sources={e.sources} />
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                  {isPhaseEnd && (
                    <View style={styles.phaseEndIndicator}>
                      <View
                        style={[
                          styles.phaseEndDot,
                          { backgroundColor: activePhase.accentColor },
                        ]}
                      />
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
      scrollEventThrottle={32}
      onScroll={({ nativeEvent }) => {
        handleHeaderScroll({ nativeEvent });
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
      {feed.map((t, i) => (
        <View key={t.id}>
          {renderThemeBlock(t, i === 0)}

          <CommentsSection type="theme" itemId={t.id} />
        </View>
      ))}
      <Modal
        visible={factCheckModal.visible}
        animationType="fade"
        transparent
        onRequestClose={() =>
          setFactCheckModal({ visible: false, factCheck: null })
        }
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setFactCheckModal({ visible: false, factCheck: null })}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Fact-check details</Text>
            {factCheckModal.factCheck ? (
              <>
                <Text style={styles.modalScore}>
                  {factCheckModal.factCheck.confidenceScore}% confidence
                </Text>
                {factCheckModal.factCheck.explanation ? (
                  <Text style={styles.modalBody}>
                    {factCheckModal.factCheck.explanation}
                  </Text>
                ) : null}
                {factCheckModal.factCheck.lastCheckedAt ? (
                  <Text style={styles.modalMeta}>
                    Last updated:{" "}
                    {new Date(
                      factCheckModal.factCheck.lastCheckedAt
                    ).toLocaleString()}
                  </Text>
                ) : null}
              </>
            ) : null}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() =>
                setFactCheckModal({ visible: false, factCheck: null })
              }
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  themeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  themeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionButton: {
    padding: 10,
    borderRadius: 14,
  },

  category: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  subcategory: {
    fontFamily: fonts.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textDecorationLine: "underline",
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 0,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  analysisButtonText: {
    color: colors.textPrimary,
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
  sliderTrackWrap: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
  },
  slider: { flex: 1, height: 40 },
  sliderLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    width: 60,
    textAlign: "center",
  },

  // TIMELINE
  section: { marginBottom: spacing.lg },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: 4,
  },

  // PHASES
  phaseHeader: {
    marginBottom: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  phaseTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: "#111827",
    textAlign: "center",
  },
  phaseSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },

  overviewBlock: {
    marginBottom: spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  overviewHeading: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.textPrimary,
  },
  updateBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  updateBadgeText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: "600",
  },

  eventBlock: {
    marginBottom: spacing.lg,
  },

  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    gap: spacing.sm,
  },
  eventImage: {
    width: "100%",
    height: 190,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  eventImagePlaceholder: {
    width: "100%",
    height: 190,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  eventImageEmoji: {
    fontSize: 26,
  },
  eventContent: {
    gap: 6,
  },

  eventDate: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
    fontStyle: "italic",
    marginBottom: 4,
  },

  eventTitle: {
  fontFamily: fonts.heading,
  fontSize: 16,
  color: colors.textPrimary,
  fontWeight: "700",   // BOLD
},

  factCheckContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    gap: 4,
  },
  factCheckBadge: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
    borderWidth: 1.25,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },


  eventSources: {
    marginTop: spacing.sm,
  },
  phaseEndIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    paddingLeft: spacing.sm,
  },
  phaseEndDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: spacing.lg,
    gap: 8,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
  },
  modalScore: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalClose: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCloseText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
