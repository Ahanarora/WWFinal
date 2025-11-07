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
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function RenderWithContext({ text = "", contexts = [], navigation }) {
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
                <TouchableOpacity
                  key={`${term}-${Math.random()}`}
                  onPress={() => setPopup(info)}
                >
                  <Text style={styles.highlight}>{seg}</Text>
                </TouchableOpacity>
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
        <TouchableOpacity
          key={i}
          onPress={async () => {
            try {
              // Use the ID exactly as it appears in Firestore
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

              navigation.navigate(
                n.linkType === "story" ? "Story" : "Theme",
                { [n.linkType]: data }
              );
            } catch (err) {
              console.error("🔗 Link navigation error:", err);
              alert("⚠️ Failed to open link");
            }
          }}
        >
          <Text style={styles.link}>{n.label}</Text>
        </TouchableOpacity>
      );
    }

    // ---------- 3️⃣ External links ----------
    if (n.type === "externalLink") {
      return (
        <Text
          key={i}
          style={styles.link}
          onPress={() => Linking.openURL(n.href)}
        >
          {n.label}
        </Text>
      );
    }
  };

  return (
    <>
      <Text style={styles.text}>
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
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{popup?.term}</Text>
            <Text style={styles.modalBody}>{popup?.explainer}</Text>
            <TouchableOpacity onPress={() => setPopup(null)}>
              <Text style={styles.close}>Close</Text>
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
    color: "#2563EB",
    textDecorationLine: "underline",
  },
  highlight: {
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
    textDecorationColor: "black",
    color: "#000",
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
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 10,
    textAlign: "right",
  },
});
