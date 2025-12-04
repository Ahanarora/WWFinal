// ----------------------------------------
// screens/EventReaderModal.js
// Full-screen vertical event reader (Inshorts-style, fade-in + phases)
// ----------------------------------------
import React, { useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Image,
  StatusBar,
  Animated,
  Modal,
  TouchableOpacity,
} from "react-native";
import { fonts, spacing, getThemeColors } from "../styles/theme";
import RenderWithContext from "../components/RenderWithContext";
import SourceLinks from "../components/SourceLinks";
import { formatDateLongOrdinal } from "../utils/formatTime";
import { useUserData } from "../contexts/UserDataContext";

function getFactCheckRgb(score) {
  if (score >= 85) return { bg: "#BBF7D0", text: "#166534" };
  if (score >= 70) return { bg: "#FEF9C3", text: "#854D0E" };
  if (score >= 50) return { bg: "#FFEDD5", text: "#9A3412" };
  return { bg: "#FEE2E2", text: "#991B1B" };
}

// -------------------------------
// Reusable card for each event
// -------------------------------
const EventCard = React.memo(function EventCard({
  event,
  navigation,
  headerTitle,
  onOpenFactCheck,
  palette,
  styles,
}) {
  if (!event) return null;

  const {
    date = "",
    title = "",
    description = "",
    contexts = [],
    sources = [],
    imageUrl = null,
    phaseTitle = null,
    factCheck = null,
  } = event;

  const formattedDate = date ? formatDateLongOrdinal(date) : "";
  const hasFactCheck =
    factCheck &&
    typeof factCheck.confidenceScore === "number" &&
    !Number.isNaN(factCheck.confidenceScore);
  const factCheckColors = hasFactCheck
    ? getFactCheckRgb(factCheck.confidenceScore)
    : null;

  return (
    <View style={styles.cardInner}>
      {/* STORY/THEME TITLE */}
      {headerTitle ? (
        <Text style={styles.modalStoryTitle}>{headerTitle}</Text>
      ) : null}

      {/* PHASE TITLE */}
      {phaseTitle ? (
        <Text style={styles.modalPhaseTitle}>{phaseTitle}</Text>
      ) : null}

      {/* IMAGE */}
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : null}

      {/* CONTENT */}
          <View style={styles.content}>
            {formattedDate ? <Text style={styles.date}>{formattedDate}</Text> : null}
            {title ? <Text style={styles.title}>{title}</Text> : null}

            {description ? (
              <View style={styles.body}>
                <RenderWithContext
                  text={description}
                  contexts={contexts}
                  navigation={navigation}
                  themeColors={palette}
                />
              </View>
            ) : null}

        {/* SOURCES */}
        {Array.isArray(sources) && sources.length > 0 && (
          <View style={styles.sources}>
            <SourceLinks sources={sources} themeColors={palette} />
          </View>
        )}

        {hasFactCheck && (
          <View style={styles.factCheckBlock}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onOpenFactCheck?.(factCheck)}
            >
              <Text
                style={[
                  styles.factCheckBadge,
                  {
                    backgroundColor: factCheckColors.bg,
                    color: factCheckColors.text,
                  },
                ]}
              >
                {factCheck.confidenceScore}% fact-check confidence
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
});

// ----------------------------------------
// MAIN READER COMPONENT
// ----------------------------------------
export default function EventReaderModal({ route, navigation }) {
  const {
    events: rawEvents = [],
    startIndex = 0,
    headerTitle = "",
  } = route.params || {};
  const { themeColors, darkMode } = useUserData();
  const palette = themeColors || getThemeColors(darkMode);
  const styles = useMemo(() => createStyles(palette), [palette]);

  // Normalize event data
  const safeEvents = useMemo(() => {
    if (!Array.isArray(rawEvents)) return [];

    return rawEvents
      .filter(Boolean)
      .map((e) => ({
        date: e?.date || "",
        title: e?.event || "",
        description: e?.description || "",
        contexts: Array.isArray(e?.contexts) ? e.contexts : [],
        sources: Array.isArray(e?.sources) ? e.sources : [],
        imageUrl: e?.imageUrl || e?.image || e?.thumbnail || null,
        phaseTitle: e?.phaseTitle || null,
        factCheck: e?.factCheck || null,
      }));
  }, [rawEvents]);

  const [index, setIndex] = useState(
    Math.min(Math.max(startIndex, 0), Math.max(safeEvents.length - 1, 0))
  );

  const [isTransitioning, setIsTransitioning] = useState(false);
  const anim = useRef(new Animated.Value(1)).current;
  const [factCheckModal, setFactCheckModal] = useState({
    visible: false,
    factCheck: null,
  });

  if (!safeEvents || safeEvents.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text>No events to show.</Text>
      </View>
    );
  }

  const currentEvent = safeEvents[index];

  // --------------------------
  // SIMPLE FADE-IN TRANSITION (SINGLE CARD)
  // --------------------------
  const startTransition = (targetIndex) => {
    if (targetIndex === index) return;
    if (targetIndex < 0 || targetIndex > safeEvents.length - 1) return;
    if (isTransitioning) return;

    setIsTransitioning(true);

    // Immediately switch to the new event, but start from opacity 0
    setIndex(targetIndex);
    anim.setValue(0);

    Animated.timing(anim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setIsTransitioning(false);
    });
  };

  // --------------------------
  // SWIPE HANDLER
  // --------------------------
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => {
          // Only start on vertical gestures
          return Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx);
        },
        onPanResponderMove: () => {},
        onPanResponderRelease: (_, g) => {
          if (isTransitioning) return;

          const { dy, vy } = g;
          const threshold = 80;
          const velocityThreshold = 0.3;

          const isSwipeUp =
            dy < -threshold || (dy < 0 && Math.abs(vy) > velocityThreshold);
          const isSwipeDown =
            dy > threshold || (dy > 0 && Math.abs(vy) > velocityThreshold);

          // NEXT
          if (isSwipeUp && index < safeEvents.length - 1) {
            startTransition(index + 1);
            return;
          }

          // PREVIOUS (or close if at first)
          if (isSwipeDown) {
            if (index > 0) {
              startTransition(index - 1);
            } else {
              navigation.goBack();
            }
          }
        },
      }),
    [index, isTransitioning, safeEvents.length, navigation]
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={palette.background}
      />

      {/* HANDLE */}
      <View style={styles.dragHandle} />

      {/* COUNTER */}
      <View style={styles.counterRow}>
        <Text style={styles.counterText}>
          {index + 1} / {safeEvents.length}
        </Text>
      </View>

      {/* SINGLE CARD (NO STACK) */}
      <View style={styles.cardStack} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.cardLayer,
            {
              opacity: anim,
            },
          ]}
        >
          <EventCard
            event={currentEvent}
            navigation={navigation}
            headerTitle={headerTitle}
            onOpenFactCheck={(fc) =>
              setFactCheckModal({ visible: true, factCheck: fc })
            }
            palette={palette}
            styles={styles}
          />
        </Animated.View>
      </View>

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
    </View>
  );
}

// ----------------------------------------
// STYLES
// ----------------------------------------
const createStyles = (palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
      paddingTop: 24,
    },

    dragHandle: {
      alignSelf: "center",
      width: 50,
      height: 4,
      borderRadius: 999,
      backgroundColor: palette.border,
      marginBottom: 8,
    },

    counterRow: {
      alignItems: "center",
      marginBottom: 4,
    },

    counterText: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.textSecondary,
    },

    cardStack: {
      flex: 1,
      position: "relative",
    },

    cardLayer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: palette.background,
    },

    cardInner: {
      flex: 1,
      backgroundColor: palette.surface,
    },

  modalStoryTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 26,
    color: palette.textPrimary,
    paddingHorizontal: spacing.md,
    paddingBottom: 2,
  },

  modalPhaseTitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textSecondary,
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
  },

    image: {
      width: "100%",
      height: 220,
      backgroundColor: palette.border,
    },

    content: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },

    date: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.textSecondary,
      marginBottom: 4,
    },

  title: {
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 24,
    color: palette.textPrimary,
    marginBottom: spacing.sm,
  },

    body: {
      marginTop: 4,
      marginBottom: spacing.md,
    },

    sources: {
      marginTop: 8,
    },

    factCheckBlock: {
      marginTop: spacing.sm,
      paddingTop: spacing.xs,
      borderTopWidth: 0.5,
      borderTopColor: palette.border,
      gap: 6,
    },
    factCheckBadge: {
      fontSize: 12,
      fontWeight: "700",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      alignSelf: "flex-start",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      padding: spacing.md,
    },
    modalCard: {
      backgroundColor: palette.surface,
      borderRadius: 12,
      padding: spacing.lg,
      gap: 8,
      borderWidth: 1,
      borderColor: palette.border,
    },
    modalTitle: {
      fontFamily: fonts.heading,
      fontSize: 18,
      color: palette.textPrimary,
    },
    modalScore: {
      fontFamily: fonts.heading,
      fontSize: 16,
      color: palette.textPrimary,
    },
    modalBody: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: palette.textSecondary,
      lineHeight: 20,
    },
    modalMeta: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.textSecondary,
    },
    modalClose: {
      alignSelf: "flex-end",
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    modalCloseText: {
      color: palette.textPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
  });
