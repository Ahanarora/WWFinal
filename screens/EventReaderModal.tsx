// ----------------------------------------
// screens/EventReaderModal.tsx
// Full-screen vertical event reader (Inshorts-style)
// Phase 2B — Navigation-driven modal screen
// ----------------------------------------

import React, { useRef, useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Image,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";

import { fonts, spacing, getThemeColors } from "../styles/theme";
import RenderWithContext from "../components/RenderWithContext";
import SourceLinks from "../components/SourceLinks";
import { formatDateLongOrdinal } from "../utils/formatTime";
import { useUserData } from "../contexts/UserDataContext";
import { track } from "../utils/analytics";

import type {
  TimelineBlock,
  TimelineEventBlock,
  TimelineImageBlock,
} from "@ww/shared";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

// ----------------------------------------
// Types
// ----------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, "EventReader">;

type ThemeColors = ReturnType<typeof getThemeColors>;

/**
 * UI-only extensions (NOT part of @ww/shared canonical model)
 * Phase 2B rule: UI may extend, but shared types remain pure.
 */
type EventUIExtensions = {
  media?: {
    imageUrl?: string | null;
  };
  phaseTitle?: string;
};

type EventWithUI = TimelineEventBlock & EventUIExtensions;
type ReaderBlock = TimelineBlock | EventWithUI;

// ----------------------------------------
// Utils
// ----------------------------------------
const SCREEN_WIDTH = Dimensions.get("window").width;
const getImageHeight = (aspectRatio?: number) => {
  const ar =
    typeof aspectRatio === "number" && aspectRatio > 0 ? aspectRatio : 16 / 9;
  return Math.round(SCREEN_WIDTH / ar);
};

// ----------------------------------------
// Screen
// ----------------------------------------

export default function EventReaderModal({ route, navigation }: Props) {
  const { events = [], initialIndex = 0 } = route.params ?? {};

  useEffect(() => {
    track("open_event_reader", { source: "story" });
  }, []);

  const { themeColors, darkMode } = useUserData();

  const palette: ThemeColors & { isDark: boolean } = {
    ...(themeColors || getThemeColors(darkMode)),
    isDark: !!darkMode,
  };

  const styles = useMemo(() => createStyles(palette), [palette]);

  const safeBlocks = useMemo(
    () => (Array.isArray(events) ? events.filter(Boolean) : []) as ReaderBlock[],
    [events]
  );

  const [index, setIndex] = useState(
    Math.min(
      Math.max(initialIndex, 0),
      Math.max(safeBlocks.length - 1, 0)
    )
  );

  const anim = useRef(new Animated.Value(1)).current;
  const [transitioning, setTransitioning] = useState(false);

  const renderBlock = (block: ReaderBlock) => {
    if (block?.type === "image") {
      const img = block as TimelineImageBlock;
      const height = getImageHeight(img.aspectRatio);

      return (
        <View style={styles.cardInner}>
          <StatusBar
            barStyle={palette.isDark ? "light-content" : "dark-content"}
            backgroundColor={palette.background}
          />
          <Image
            source={{ uri: img.url }}
            style={[styles.fullImage, { height }]}
            resizeMode="cover"
          />
          {(img.caption || img.credit) && (
            <View style={styles.imageMeta}>
              {!!img.caption && (
                <Text style={styles.imageCaption}>{img.caption}</Text>
              )}
              {!!img.credit && (
                <Text style={styles.imageCredit}>{img.credit}</Text>
              )}
            </View>
          )}
        </View>
      );
    }

    const event = block as EventWithUI;
    const contexts =
      Array.isArray((event as any).contexts) && (event as any).contexts.length
        ? (event as any).contexts
        : [];

    const media = event.media ?? null;
    const phaseTitle = event.phaseTitle ?? null;

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
        </View>
      </View>
    );
  };

  const startTransition = (next: number) => {
    if (
      transitioning ||
      next === index ||
      next < 0 ||
      next > safeBlocks.length - 1
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

          if (swipeUp && index < safeBlocks.length - 1) {
            startTransition(index + 1);
          } else if (swipeDown) {
            if (index > 0) startTransition(index - 1);
            else navigation.goBack();
          }
        },
      }),
    [index, transitioning, safeBlocks.length, navigation]
  );

  if (!safeBlocks.length) {
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
          {index + 1} / {safeBlocks.length}
        </Text>
      </View>

      <View style={styles.cardStack} {...panResponder.panHandlers}>
        <Animated.View style={[styles.cardLayer, { opacity: anim }]}>
          {renderBlock(safeBlocks[index])}
        </Animated.View>
      </View>
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
    fullImage: {
      width: SCREEN_WIDTH,
      backgroundColor: palette.border,
    },
    imageMeta: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: 6,
    },
    imageCaption: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: palette.textPrimary,
      lineHeight: 20,
    },
    imageCredit: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.textSecondary,
    },
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
  });
