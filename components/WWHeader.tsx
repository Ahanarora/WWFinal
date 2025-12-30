import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useUserData } from "../contexts/UserDataContext";

// If you converted SVG → component (BEST)
import WaitWhatLogo from "./WaitWhatLogo";

// ----------------------------------------
// WWHeader
// ----------------------------------------

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
      {/* LEFT — MENU */}
      <TouchableOpacity
        onPress={() => navigation.navigate("WhatIsWaitWhat")}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="menu"
          size={24}
          color={themeColors.textPrimary}
        />
      </TouchableOpacity>

      {/* CENTER — LOGO */}
      <TouchableOpacity
        style={styles.centerWrap}
        onPress={() =>
          navigation.navigate("RootTabs", { screen: "HomeTab" })
        }
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <WaitWhatLogo
          width={160}
          height={36}
          color={themeColors.textPrimary}
        />
      </TouchableOpacity>

      {/* RIGHT — SEARCH */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Search", { query: "" })}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="search"
          size={22}
          color={themeColors.textPrimary}
        />
      </TouchableOpacity>
    </View>
  );
}

// ----------------------------------------
// Styles
// ----------------------------------------

const styles = StyleSheet.create({
  container: {
    height: 72,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
