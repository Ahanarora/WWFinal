// ----------------------------------------
// components/SourceLinks.js
// ----------------------------------------

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  Linking,
} from "react-native";
import { fonts, spacing, getThemeColors } from "../styles/theme";
import { getInitials } from "../utils/getFaviconUrl";
import { getFallbackFavicon } from "../utils/getFaviconUrl";
import { getFaviconUrl } from "../utils/getFaviconUrl";
import { normalizeSources } from "../utils/normalizeSources";

function getHostFromUrl(url) {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getPublisherFromSource(s) {
  if (!s) return "";
  if (typeof s.sourceName === "string" && s.sourceName.trim()) return s.sourceName.trim();
  if (typeof s.siteName === "string" && s.siteName.trim()) return s.siteName.trim();
  if (typeof s.link === "string" && s.link) return getHostFromUrl(s.link);
  return "";
}

function getGoogleFavicon(url) {
  const host = getHostFromUrl(url);
  if (!host) return "";
  return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
}

// ------------------------------
// MAIN COMPONENT
// ------------------------------
export default function SourceLinks({ sources, themeColors }) {
  const palette = themeColors || getThemeColors(false);

  // ✅ Canonical normalization boundary
  const safeSources = useMemo(() => normalizeSources(sources), [sources]);

  const [preview, setPreview] = useState(null);

  const openPreview = (s) => {
    if (!s?.link) return;
    setPreview({
      link: s.link,
      title: s.title || "Open link",
      host: getHostFromUrl(s.link),
    });
  };

  const confirmOpen = async () => {
    if (!preview?.link) return;
    const url = preview.link;
    setPreview(null);
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.warn("Failed to open url", e);
    }
  };

  const styles = useMemo(() => createStyles(palette), [palette]);

  if (!safeSources.length) return null;

  return (
    <>
      <View style={styles.container}>
        {safeSources.map((s, idx) => {
          const publisher = getPublisherFromSource(s) || "Source";
          const initials = getInitials(publisher);
          const favicon = getFaviconUrl(s.link) || getFallbackFavicon(publisher);

          return (
            <FaviconCard
              key={`${s.link}-${idx}`}
              s={s}
              palette={palette}
              styles={styles}
              initials={initials}
              publisher={publisher}
              onPress={() => openPreview(s)}
              favicon={favicon}
            />
          );
        })}
      </View>

      {/* PREVIEW MODAL */}
      <Modal transparent visible={!!preview} animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.previewOverlay} onPress={() => setPreview(null)}>
          <Pressable style={styles.previewCard} onPress={() => {}}>
            <Text style={styles.previewTitle} numberOfLines={2}>
              {preview?.title || "Open link"}
            </Text>

            {preview?.host ? (
              <Text style={styles.previewHost} numberOfLines={1}>
                {preview.host}
              </Text>
            ) : null}

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.previewButton, styles.previewCancel]}
                onPress={() => setPreview(null)}
              >
                <Text style={styles.previewButtonText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.previewButton, styles.previewOpen, { backgroundColor: palette.accent }]}
                onPress={confirmOpen}
              >
                <Text style={[styles.previewButtonText, { color: "#fff" }]}>Open</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ------------------------------
// Favicon Card Component
// ------------------------------
function FaviconCard({ s, palette, styles, initials, publisher, onPress }) {
  const [stage, setStage] = useState("google");

  const faviconUrl = getGoogleFavicon(s.link);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* GOOGLE FAVICON */}
      {stage !== "initials" && faviconUrl && (
        <Image source={{ uri: faviconUrl }} style={styles.favicon} onError={() => setStage("initials")} />
      )}

      {/* INITIALS FALLBACK */}
      {(stage === "initials" || !faviconUrl) && (
        <View style={styles.initialsBubble}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: palette.textPrimary }]} numberOfLines={2}>
          {s.title || "Untitled Article"}
        </Text>

        <Text style={[styles.subtitle, { color: palette.textSecondary }]} numberOfLines={1}>
          {publisher}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ------------------------------
// STYLES
// ------------------------------
const createStyles = (palette) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: spacing.xs || 4,
    },

    card: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderWidth: 1,
      minWidth: 170,
      maxWidth: 200,
    },

    favicon: {
      width: 18,
      height: 18,
      borderRadius: 4,
      marginRight: 8,
      backgroundColor: palette.border,
    },

    initialsBubble: {
      width: 18,
      height: 18,
      borderRadius: 4,
      marginRight: 8,
      backgroundColor: palette.border,
      alignItems: "center",
      justifyContent: "center",
    },

    initialsText: {
      color: palette.textPrimary,
      fontSize: 10,
      fontFamily: fonts.heading,
    },

    title: {
      fontFamily: fonts.body,
      fontSize: 12,
      lineHeight: 16,
    },

    subtitle: {
      fontFamily: fonts.body,
      fontSize: 11,
      lineHeight: 14,
      marginTop: 2,
    },

    // Modal preview
    previewOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
    },

    previewCard: {
      width: "100%",
      backgroundColor: palette.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: palette.border,
      gap: 8,
    },

    previewTitle: {
      fontFamily: fonts.heading,
      fontSize: 15,
      color: palette.textPrimary,
    },

    previewHost: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.textSecondary,
    },

    previewActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 6,
    },

    previewButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
    },

    previewCancel: {
      backgroundColor: palette.border,
    },

    previewOpen: {
      backgroundColor: palette.accent,
    },

    previewButtonText: {
      fontFamily: fonts.heading,
      fontSize: 13,
      color: palette.textPrimary,
    },
  });
