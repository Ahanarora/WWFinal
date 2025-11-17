// ----------------------------------------
// App.js — Wait...What? News App
// ----------------------------------------
import React, { useMemo } from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { colors } from "./styles/theme";


// Screens
import HomeScreen from "./screens/HomeScreen";
import StoriesScreen from "./screens/StoriesScreen";
import ThemesScreen from "./screens/ThemesScreen";
import StoryScreen from "./screens/StoryScreen";
import ThemeScreen from "./screens/ThemeScreen";
import AnalysisModalScreen from "./screens/AnalysisModalScreen"; // ✅ NEW
import EventReaderModal from "./screens/EventReaderModal";

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
    const text = "Wait...What?".split("");
    const fontCycle = [
      "Barrio",
      "Bangers",
      "CinzelDecorative",
      "Jacquard24",
      "OldeEnglish",
      "Kranky",
      "LondrinaShadow",
      "TurretRoadBold",
      "TurretRoadExtraBold",
      "Montserrat",
    ];

    return (
      <Text style={{ flexDirection: "row", fontSize: 0 }}>
        {text.map((char, index) => (
          <Text
            key={`${char}-${index}`}
            style={{
              fontFamily: fontCycle[index % fontCycle.length],
              fontSize: 32,
              color: index % 2 === 0 ? colors.textPrimary : colors.accent,
            }}
          >
            {char}
          </Text>
        ))}
      </Text>
    );
  }, []);

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
      headerTitle: () => waitHeader,
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

  <Stack.Screen
  name="EventReader"
  component={EventReaderModal}
  options={{
    presentation: "modal",
    headerShown: false,
  }}
/>
</Stack.Navigator>

    </NavigationContainer>
  );
}
