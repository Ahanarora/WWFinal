import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useUserData } from "../contexts/UserDataContext";

export default function WWHeader() {
  const navigation = useNavigation<any>();
  const { themeColors } = useUserData();

  if (!themeColors) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.surface,
          borderBottomColor: themeColors.border,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate("WhatIsWaitWhat")}
        hitSlop={10}
        style={styles.iconButton}
      >
        <Ionicons name="menu" size={24} color={themeColors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.centerWrap}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("RootTabs", { screen: "HomeTab" })
          }
          hitSlop={10}
        >
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>
            Wait...What?
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Search", { query: "" })}
          hitSlop={10}
        >
          <Ionicons
            name="search"
            size={22}
            color={themeColors.textPrimary}
          />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 76,
    paddingTop: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: "IMFellGreatPrimerSC",
    fontSize: 30,
    letterSpacing: 0.5,
    fontStyle: "italic",
    fontWeight: "700",
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 16,
  },
  iconButton: {
    paddingVertical: 4,
  },
});
