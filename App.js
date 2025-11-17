// ----------------------------------------
// App.js — Wait...What? News App
// ----------------------------------------
import React from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";


// Screens
import HomeScreen from "./screens/HomeScreen";
import StoriesScreen from "./screens/StoriesScreen";
import ThemesScreen from "./screens/ThemesScreen";
import StoryScreen from "./screens/StoryScreen";
import ThemeScreen from "./screens/ThemeScreen";
import AnalysisModalScreen from "./screens/AnalysisModalScreen"; // ✅ NEW

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
      {/* 🏠 Home */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: "Home" }}
      />

      {/* 📰 Stories */}
      <Tab.Screen
        name="StoriesTab"
        component={StoriesScreen}
        options={{ title: "Stories" }}
      />

      {/* 🧭 Themes */}
      <Tab.Screen
        name="ThemesTab"
        component={ThemesScreen}
        options={{ title: "Themes" }}
      />
    </Tab.Navigator>
  );
}

// ----------------------------------------
// 🧭 Root Stack Navigation
// ----------------------------------------
export default function App() {
  // Load fonts
  const [fontsLoaded] = useFonts({
   Jacquard24: require("./assets/fonts/Jacquard24-Regular.ttf"),
   Kranky: require("./assets/fonts/Kranky-Regular.ttf"),
  });

 if (!fontsLoaded) {
  return null; // OR return a splash component
}


  return (
    <NavigationContainer>
      <Stack.Navigator>
  <Stack.Screen
    name="RootTabs"
    component={Tabs}
    options={{
      headerTitleAlign: "center",
      headerTitle: () => (
        <Text style={{ flexDirection: "row" }}>
          <Text style={{ fontFamily: "Jacquard24", fontSize: 72, color: "black" }}>
            W
          </Text>
          <Text
            style={{
              fontFamily: "Kranky",
              fontSize: 55,
              fontWeight: "500",
              color: "black",
            }}
          >
            ait...what?
          </Text>
        </Text>
      ),
    }}
  />

  <Stack.Screen
    name="Story"
    component={StoryScreen}
    options={{
      title: "Story",
      headerBackTitle: "Back",
    }}
  />

  <Stack.Screen
    name="Theme"
    component={ThemeScreen}
    options={{
      title: "Theme",
      headerBackTitle: "Back",
    }}
  />

  {/* ✅ ADD THIS */}
  <Stack.Screen
    name="AnalysisModal"
    component={AnalysisModalScreen}
    options={{
      presentation: "modal",
      headerShown: false,
    }}
  />
</Stack.Navigator>

    </NavigationContainer>
  );
}
