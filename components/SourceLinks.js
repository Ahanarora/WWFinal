// ----------------------------------------
// components/SourceLinks.js (GOOGLE FAVICONS VERSION)
// ----------------------------------------

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
  Modal,
  Pressable,
} from "react-native";
import { fonts, spacing, getThemeColors } from "../styles/theme";

// ------------------------------
// HELPERS
// ------------------------------
const getGoogleFavicon = (link) => {
  try {
    const domain = new URL(link).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 3) || "?";

// ------------------------------
// MAIN COMPONENT
// ------------------------------
export default function SourceLinks({ sources = [], themeColors }) {
  const palette = themeColors || getThemeColors(false);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [preview, setPreview] = useState(null);

  if (!Array.isArray(sources) || sources.length === 0) return null;

  const openPreview = (source) => {
    if (!source?.link) return;
    setPreview({
      title: source.title || "Link",
      link: source.link,
      host: (() => {
        try {
          return new URL(source.link).hostname;
        } catch {
          return "";
        }
      })(),
    });
  };

  const confirmOpen = async () => {
    if (!preview?.link) return;
    const url = preview.link;
    setPreview(null);
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.warn("Failed to open link", err);
    }
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {sources.map((s, i) => {
          const publisher =
            s.sourceName ||
            s.siteName ||
            (() => {
              try {
                return new URL(s.link).hostname.replace(/^www\./, "");
              } catch {
                return "Source";
              }
            })();

          const initials = getInitials(publisher);

          return (
            <FaviconCard
              key={i}
              s={s}
              palette={palette}
              styles={styles}
              initials={initials}
              publisher={publisher}
              onPress={() => openPreview(s)}
            />
          );
        })}
      </ScrollView>

      {/* Preview Modal */}
      <Modal
        visible={!!preview}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <Pressable
          style={styles.previewOverlay}
          onPress={() => setPreview(null)}
        >
          <Pressable
            style={[
              styles.previewCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text
              style={[styles.previewTitle, { color: palette.textPrimary }]}
              numberOfLines={2}
            >
              {preview?.title}
            </Text>

            {!!preview?.host && (
              <Text
                style={[styles.previewHost, { color: palette.textSecondary }]}
              >
                {preview.host}
              </Text>
            )}

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.previewButton, styles.previewCancel]}
                onPress={() => setPreview(null)}
              >
                <Text style={styles.previewButtonText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.previewButton,
                  styles.previewOpen,
                  { backgroundColor: palette.accent },
                ]}
                onPress={confirmOpen}
              >
                <Text
                  style={[styles.previewButtonText, { color: "#fff" }]}
                >
                  Open
                </Text>
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
function FaviconCard({
  s,
  palette,
  styles,
  initials,
  publisher,
  onPress,
}) {
  const [stage, setStage] = useState("google");

  const faviconUrl = getGoogleFavicon(s.link);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* GOOGLE FAVICON */}
      {stage !== "initials" && faviconUrl && (
        <Image
          source={{ uri: faviconUrl }}
          style={styles.favicon}
          onError={() => setStage("initials")}
        />
      )}

      {/* INITIALS FALLBACK */}
      {(stage === "initials" || !faviconUrl) && (
        <View style={styles.initialsBubble}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text
          style={[styles.title, { color: palette.textPrimary }]}
          numberOfLines={2}
        >
          {s.title || "Untitled Article"}
        </Text>

        <Text
          style={[styles.subtitle, { color: palette.textSecondary }]}
          numberOfLines={1}
        >
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
      fontWeight: "600",
    },
    title: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 11.5,
      lineHeight: 16,
      marginTop: 2,
    },
    previewOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    previewCard: {
      borderRadius: 10,
      padding: 10,
      gap: 6,
      minWidth: 200,
      maxWidth: 260,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    previewTitle: { fontSize: 14, fontWeight: "700" },
    previewHost: { fontSize: 12 },
    previewActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 6,
    },
    previewButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    previewCancel: { backgroundColor: "rgba(255,255,255,0.08)" },
    previewOpen: {},
    previewButtonText: { fontSize: 12, fontWeight: "700" },
  });
