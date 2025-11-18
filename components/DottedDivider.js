// components/DottedDivider.js
import React from "react";
import { View, StyleSheet } from "react-native";

export default function DottedDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    borderBottomWidth: 2,
    borderColor: "#000",
    borderStyle: "dotted",
    marginVertical: 10,       // space above & below
  },
});
