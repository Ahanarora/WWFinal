// ----------------------------------------
// components/RenderWithContext.js
// ----------------------------------------
import React, { useState } from "react";
import {
  Text,
  Modal,
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";

export default function RenderWithContext({ text = "", contexts = [] }) {
  const [popup, setPopup] = useState(null);

  if (!text) return null;

  // ✅ Build text tokens with highlighted terms
  let rendered = [text];
  contexts.forEach(({ term }) => {
    if (!term) return;
    const parts = [];
    rendered.forEach((chunk) => {
      if (typeof chunk !== "string") return parts.push(chunk);
      const regex = new RegExp(`(${term})`, "gi");
      const split = chunk.split(regex);
      split.forEach((seg) => {
        if (seg.toLowerCase() === term.toLowerCase()) {
          const info = contexts.find(
            (c) => c.term.toLowerCase() === term.toLowerCase()
          );
          parts.push(
            <TouchableOpacity
              key={`${term}-${Math.random()}`}
              onPress={() => setPopup(info)}
            >
              <Text style={styles.highlight}>{seg}</Text>
            </TouchableOpacity>
          );
        } else {
          parts.push(seg);
        }
      });
    });
    rendered = parts;
  });

  return (
    <>
      <Text style={styles.text}>{rendered}</Text>

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
  highlight: {
    color: "#2563EB",
    textDecorationLine: "underline",
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
