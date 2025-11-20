// ----------------------------------------
// App.js — Wait...What? News App (WITH AUTH)
// ----------------------------------------
import React, { useState, useEffect, useMemo } from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { colors } from "./styles/theme";

// 🔐 AUTH IMPORTS
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

// Screens
import HomeScreen from "./screens/HomeScreen";
import StoriesScreen from "./screens/StoriesScreen";
import ThemesScreen from "./screens/ThemesScreen";
import StoryScreen from "./screens/StoryScreen";
import ThemeScreen from "./screens/ThemeScreen";
import AnalysisModalScreen from "./screens/AnalysisModalScreen";
import EventReaderModal from "./screens/EventReaderModal";

// 👉 You must create this file:
//    /screens/LoginScreen.js
import LoginScreen from "./screens/LoginScreen";

// Tabs and Stack
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ----------------------------------------
// 🧭 Tab Navigation
// ----------------------------------------
function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#E5E7EB",
          height: 60,
          paddingBottom: 5,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = "ellipse-outline";
          if (route.name === "HomeTab") iconName = "home-outline";
          else if (route.name === "StoriesTab") iconName = "newspaper-outline";
          else if (route.name === "ThemesTab") iconName = "compass-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 12 },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="StoriesTab" component={StoriesScreen} options={{ title: "Stories" }} />
      <Tab.Screen name="ThemesTab" component={ThemesScreen} options={{ title: "Themes" }} />
    </Tab.Navigator>
  );
}

// ----------------------------------------
// 🧭 Root Stack Navigation + AUTH GATE
// ----------------------------------------
export default function App() {
  // 🔐 Manage Auth State
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecking(false);
    });
    return unsubscribe;
  }, []);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Barrio: require("./assets/fonts/Barrio-Regular.ttf"),
    Bangers: require("./assets/Bangers-Regular.ttf"),
    Jacquard24: require("./assets/fonts/Jacquard24-Regular.ttf"),
    OldeEnglish: require("./assets/fonts/OldeEnglish.ttf"),
    Montserrat: require("./assets/fonts/Montserrat-VariableFont_wght.ttf"),
    CinzelDecorative: require("./assets/fonts/CinzelDecorative-Bold.ttf"),
    Kranky: require("./assets/fonts/Kranky-Regular.ttf"),
    LondrinaShadow: require("./assets/fonts/LondrinaShadow-Regular.ttf"),
    TurretRoadBold: require("./assets/fonts/TurretRoad-Bold.ttf"),
    TurretRoadExtraBold: require("./assets/fonts/TurretRoad-ExtraBold.ttf"),
  });

  const waitHeader = useMemo(() => {
    return (
      <Text
        style={{
          fontFamily: "Jacquard24",
          fontSize: 64,
          color: colors.textPrimary,
        }}
      >
        Wait...What?
      </Text>
    );
  }, []);

  if (!fontsLoaded || authChecking) return null;

  return (
    <NavigationContainer>
      {/* 🔐 AUTH GATE */}
      {!user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen
            name="RootTabs"
            component={Tabs}
            options={{
              headerTitleAlign: "center",
              headerTitle: () => waitHeader,
            }}
          />

          <Stack.Screen
            name="Story"
            component={StoryScreen}
            options={{ title: "Story", headerBackTitle: "Back" }}
          />

          <Stack.Screen
            name="Theme"
            component={ThemeScreen}
            options={{ title: "Theme", headerBackTitle: "Back" }}
          />

          <Stack.Screen
            name="AnalysisModal"
            component={AnalysisModalScreen}
            options={{ presentation: "modal", headerShown: false }}
          />

          <Stack.Screen
            name="EventReader"
            component={EventReaderModal}
            options={{ presentation: "modal", headerShown: false }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
