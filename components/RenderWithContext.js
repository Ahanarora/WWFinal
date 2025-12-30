// components/RenderWithContext.js
import React, { useState } from "react";
import {
  Text,
  Modal,
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Linking,
} from "react-native";
import { parseLinkedText } from "../utils/renderLinkedText";
import { db } from "../utils/firebase";;
import { doc, getDoc } from "firebase/firestore";
import { getThemeColors, fonts } from "../styles/theme";

export default function RenderWithContext({
  text = "",
  contexts = [],
  navigation,
  textStyle,
  themeColors,
}) {
  const palette = themeColors || getThemeColors(false);
  const [popup, setPopup] = useState(null);
  if (!text) return null;

  // Parse the text into tokens (plain, internal link, external link)
  const tokens = parseLinkedText(text, navigation);

  const renderPart = (n, i) => {
    // ---------- 1️⃣ Plain text ----------
    if (n.type === "text") {
      const termMatches = contexts.filter((c) =>
        n.value.toLowerCase().includes(c.term.toLowerCase())
      );
      if (termMatches.length === 0) return <Text key={i}>{n.value}</Text>;

      let chunks = [n.value];
      termMatches.forEach(({ term }) => {
        const newChunks = [];
        chunks.forEach((chunk) => {
          if (typeof chunk !== "string") return newChunks.push(chunk);
          const parts = chunk.split(new RegExp(`(${term})`, "gi"));
          parts.forEach((seg) => {
            if (seg.toLowerCase() === term.toLowerCase()) {
              const info = contexts.find(
                (c) => c.term.toLowerCase() === term.toLowerCase()
              );
              newChunks.push(
                <Text
                  key={`${term}-${Math.random()}`}
                  style={[
                    styles.highlight,
                    {
                      color: palette.textPrimary,
                      textDecorationColor: palette.textPrimary,
                    },
                  ]}
                  onPress={() => setPopup(info)}
                >
                  {seg}
                </Text>
              );
            } else newChunks.push(seg);
          });
        });
        chunks = newChunks;
      });
      return <Text key={i}>{chunks}</Text>;
    }

    // ---------- 2️⃣ Internal links ----------
    if (n.type === "internalLink") {
      return (
        <Text
          key={i}
          style={[
            styles.link,
            { color: palette.textPrimary, textDecorationColor: palette.textPrimary },
          ]}
          onPress={async () => {
            try {
              const collectionName =
                n.linkType === "story" ? "stories" : "themes";

              console.log("🧩 Raw ID:", JSON.stringify(n.id));
              console.log(`🔎 Fetching path: ${collectionName}/${n.id}`);

              const ref = doc(db, collectionName, n.id);
              const snap = await getDoc(ref);

              if (!snap.exists()) {
                alert(`⚠️ ${n.linkType} not found: ${n.id}`);
                console.log(`❌ Not found at Firestore path: ${collectionName}/${n.id}`);
                return;
              }

              const data = { id: snap.id, ...snap.data() };
              console.log("✅ Document found:", data.title || data.id);

              const routeName = n.linkType === "story" ? "Story" : "Theme";
              if (navigation?.push) {
                navigation.push(routeName, { [n.linkType]: data });
              } else if (navigation?.navigate) {
                navigation.navigate(routeName, { [n.linkType]: data });
              }
            } catch (err) {
              console.error("🔗 Link navigation error:", err);
              alert("⚠️ Failed to open link");
            }
          }}
        >
          {n.label}
        </Text>
      );
    }

    // ---------- 3️⃣ External links ----------
    if (n.type === "externalLink") {
      return (
        <Text
          key={i}
          style={[
            styles.link,
            { color: palette.textPrimary, textDecorationColor: palette.textPrimary },
          ]}
          onPress={() => Linking.openURL(n.href)}
        >
          {n.label}
        </Text>
      );
    }
  };

  return (
    <>
      <Text
        style={[
          styles.text,
          {
            color: palette.textPrimary,
            textDecorationColor: palette.textPrimary,
            fontFamily: fonts.body,
          },
          textStyle,
        ]}
      >
        {tokens.map((n, i) => renderPart(n, i))}
      </Text>

      {/* Popup modal for context explainers */}
      <Modal
        visible={!!popup}
        transparent
        animationType="fade"
        onRequestClose={() => setPopup(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setPopup(null)}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
              {popup?.term}
            </Text>
            <Text style={[styles.modalBody, { color: palette.textSecondary }]}>
              {popup?.explainer}
            </Text>
            <TouchableOpacity onPress={() => setPopup(null)}>
              <Text style={[styles.close, { color: palette.accent }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: "#222",
  },
  link: {
    textDecorationLine: "underline",
  },
  highlight: {
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: "90%",
    elevation: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  modalBody: {
    fontSize: 14,
    color: "#444",
  },
  close: {
    color: "#14532d",
    fontWeight: "600",
    marginTop: 10,
    textAlign: "right",
  },
});
