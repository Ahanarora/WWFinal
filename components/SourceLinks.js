// ----------------------------------------
// components/SourceLinks.js
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
        {sources.map((s, i) => {
          let favicon = "https://via.placeholder.com/24?text=%F0%9F%93%B0";
          try {
            const origin = new URL(s.link).origin;
            favicon = `${origin}/favicon.ico`;
          } catch (err) {}

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.card,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
              onPress={() => openPreview(s)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: favicon }}
                style={styles.favicon}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: palette.textPrimary }]} numberOfLines={2}>
                  {s.title || "Untitled Article"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal
        visible={!!preview}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <Pressable style={styles.previewOverlay} onPress={() => setPreview(null)}>
          <Pressable
            style={[
              styles.previewCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.previewTitle, { color: palette.textPrimary }]} numberOfLines={2}>
              {preview?.title}
            </Text>
            {!!preview?.host && (
              <Text style={[styles.previewHost, { color: palette.textSecondary }]}>
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
                style={[styles.previewButton, styles.previewOpen, { backgroundColor: palette.accent }]}
                onPress={confirmOpen}
              >
                <Text style={[styles.previewButtonText, { color: "#fff" }]}>
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
      backgroundColor: palette.surface,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: palette.border,
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
    title: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
      color: palette.textPrimary,
      flexShrink: 1,
    },
    previewOverlay: {
      flex: 1,
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    previewCard: {
      backgroundColor: palette.surface,
      borderRadius: 10,
      padding: 10,
      gap: 6,
      minWidth: 200,
      maxWidth: 260,
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    previewTitle: {
      fontSize: 14,
      fontWeight: "700",
    },
    previewHost: {
      fontSize: 12,
    },
    previewActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 6,
    },
    previewButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    previewCancel: {
      backgroundColor: "rgba(255,255,255,0.08)",
    },
    previewOpen: {
      backgroundColor: palette.accent,
    },
    previewButtonText: {
      fontSize: 12,
      color: "#fff",
      fontWeight: "700",
    },
  });
