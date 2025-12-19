// ----------------------------------------
// screens/EventReaderModal.tsx
// Full-screen vertical event reader (Inshorts-style)
// Phase 2B — Navigation-driven modal screen
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
  TouchableOpacity,
} from "react-native";

import { fonts, spacing, getThemeColors } from "../styles/theme";
import RenderWithContext from "../components/RenderWithContext";
import SourceLinks from "../components/SourceLinks";
import { formatDateLongOrdinal } from "../utils/formatTime";
import { useUserData } from "../contexts/UserDataContext";

import type { TimelineEventBlock } from "@ww/shared";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

// ----------------------------------------
// Types
// ----------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, "EventReader">;

type ThemeColors = ReturnType<typeof getThemeColors>;

type FactCheck = {
  confidenceScore: number;
  explanation?: string;
  lastCheckedAt?: string | number;
};

/**
 * UI-only extensions (NOT part of @ww/shared canonical model)
 * Phase 2B rule: UI may extend, but shared types remain pure.
 */
type EventUIExtensions = {
  media?: {
    imageUrl?: string | null;
  };
  factCheck?: FactCheck;
  phaseTitle?: string;
};

type EventWithUI = TimelineEventBlock & EventUIExtensions;

// ----------------------------------------
// Utils
// ----------------------------------------

function getFactCheckRgb(score: number) {
  if (score >= 85) return { bg: "#BBF7D0", text: "#166534" };
  if (score >= 70) return { bg: "#FEF9C3", text: "#854D0E" };
  if (score >= 50) return { bg: "#FFEDD5", text: "#9A3412" };
  return { bg: "#FEE2E2", text: "#991B1B" };
}

// ----------------------------------------
// Screen
// ----------------------------------------

export default function EventReaderModal({ route, navigation }: Props) {
  const { events = [], initialIndex = 0 } = route.params ?? {};

  const { themeColors, darkMode } = useUserData();

  const palette: ThemeColors & { isDark: boolean } = {
    ...(themeColors || getThemeColors(darkMode)),
    isDark: !!darkMode,
  };

  const styles = useMemo(() => createStyles(palette), [palette]);

  const safeEvents = useMemo(
    () => events.filter((e): e is EventWithUI => Boolean(e)),
    [events]
  );

  const [index, setIndex] = useState(
    Math.min(
      Math.max(initialIndex, 0),
      Math.max(safeEvents.length - 1, 0)
    )
  );

  const anim = useRef(new Animated.Value(1)).current;
  const [transitioning, setTransitioning] = useState(false);

  const [factCheckModal, setFactCheckModal] = useState<{
    visible: boolean;
    factCheck: FactCheck | null;
  }>({ visible: false, factCheck: null });

  const handleOpenFactCheck = (fc: FactCheck) => {
    setFactCheckModal({ visible: true, factCheck: fc });
  };

  const renderEventCard = (event: EventWithUI) => {
    const contexts: string[] = [];

    const media = event.media ?? null;
    const factCheck = event.factCheck ?? null;
    const phaseTitle = event.phaseTitle ?? null;

    const hasFactCheck =
      !!factCheck &&
      typeof factCheck.confidenceScore === "number" &&
      !Number.isNaN(factCheck.confidenceScore);

    const factCheckColors = hasFactCheck
      ? getFactCheckRgb(factCheck.confidenceScore)
      : null;

    const formattedDate = event.date
      ? formatDateLongOrdinal(event.date)
      : "";

    return (
      <View style={styles.cardInner}>
        <StatusBar
          barStyle={palette.isDark ? "light-content" : "dark-content"}
          backgroundColor={palette.background}
        />

        {phaseTitle ? (
          <Text style={styles.modalPhaseTitle}>{phaseTitle}</Text>
        ) : null}

        {media?.imageUrl ? (
          <Image source={{ uri: media.imageUrl }} style={styles.image} />
        ) : null}

        <View style={styles.content}>
          {formattedDate ? (
            <Text style={styles.date}>{formattedDate}</Text>
          ) : null}

          {event.title ? (
            <Text style={styles.title}>{event.title}</Text>
          ) : null}

          {event.description ? (
            <View style={styles.body}>
              <RenderWithContext
                text={event.description}
                contexts={contexts}
                navigation={navigation}
                themeColors={palette}
                textStyle={{}}
              />
            </View>
          ) : null}

          {event.sources?.length ? (
            <View style={styles.sources}>
              <SourceLinks sources={event.sources} themeColors={palette} />
            </View>
          ) : null}

          {hasFactCheck && factCheck && factCheckColors ? (
            <View style={styles.factCheckBlock}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleOpenFactCheck(factCheck)}
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
          ) : null}
        </View>
      </View>
    );
  };

  const startTransition = (next: number) => {
    if (
      transitioning ||
      next === index ||
      next < 0 ||
      next > safeEvents.length - 1
    )
      return;

    setTransitioning(true);
    setIndex(next);
    anim.setValue(0);

    Animated.timing(anim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start(() => setTransitioning(false));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),

        onPanResponderRelease: (_, g) => {
          if (transitioning) return;

          const { dy, vy } = g;
          const threshold = 80;
          const velocityThreshold = 0.3;

          const swipeUp =
            dy < -threshold || (dy < 0 && Math.abs(vy) > velocityThreshold);
          const swipeDown =
            dy > threshold || (dy > 0 && Math.abs(vy) > velocityThreshold);

          if (swipeUp && index < safeEvents.length - 1) {
            startTransition(index + 1);
          } else if (swipeDown) {
            if (index > 0) startTransition(index - 1);
            else navigation.goBack();
          }
        },
      }),
    [index, transitioning, safeEvents.length, navigation]
  );

  if (!safeEvents.length) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <Text style={{ color: palette.textSecondary }}>
          No events available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.dragHandle} />

      <View style={styles.counterRow}>
        <Text style={styles.counterText}>
          {index + 1} / {safeEvents.length}
        </Text>
      </View>

      <View style={styles.cardStack} {...panResponder.panHandlers}>
        <Animated.View style={[styles.cardLayer, { opacity: anim }]}>
          {renderEventCard(safeEvents[index])}
        </Animated.View>
      </View>

      {factCheckModal.visible && factCheckModal.factCheck && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Fact-check details</Text>

            <Text style={styles.modalScore}>
              {factCheckModal.factCheck.confidenceScore}% confidence
            </Text>

            {factCheckModal.factCheck.explanation ? (
              <Text style={styles.modalBody}>
                {factCheckModal.factCheck.explanation}
              </Text>
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
        </View>
      )}
    </View>
  );
}

// ----------------------------------------
// Styles
// ----------------------------------------

const createStyles = (palette: ThemeColors & { isDark: boolean }) =>
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
    counterRow: { alignItems: "center", marginBottom: 4 },
    counterText: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.textSecondary,
    },
    cardStack: { flex: 1 },
    cardLayer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: palette.background,
    },
    cardInner: { flex: 1, backgroundColor: palette.surface },
    modalPhaseTitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: palette.textSecondary,
      paddingHorizontal: spacing.md,
      paddingBottom: 8,
    },
    image: { width: "100%", height: 220, backgroundColor: palette.border },
    content: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    date: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.textSecondary,
    },
    title: {
      fontFamily: fonts.heading,
      fontSize: 18,
      fontWeight: "500",
      color: palette.textPrimary,
      marginBottom: spacing.sm,
    },
    body: { marginBottom: spacing.md },
    sources: { marginTop: 8 },
    factCheckBlock: {
      marginTop: spacing.sm,
      paddingTop: spacing.xs,
      borderTopWidth: 0.5,
      borderTopColor: palette.border,
    },
    factCheckBadge: {
      fontSize: 12,
      fontWeight: "700",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      padding: spacing.md,
    },
    modalCard: {
      backgroundColor: palette.surface,
      borderRadius: 12,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: palette.border,
    },
    modalTitle: {
      fontFamily: fonts.heading,
      fontSize: 16,
      color: palette.textPrimary,
    },
    modalScore: {
      fontFamily: fonts.heading,
      fontSize: 14,
      color: palette.textPrimary,
    },
    modalBody: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: palette.textSecondary,
    },
    modalClose: {
      alignSelf: "flex-end",
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    modalCloseText: {
      fontFamily: fonts.heading,
      fontSize: 13,
      color: palette.textPrimary,
    },
  });
