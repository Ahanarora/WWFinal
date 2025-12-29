// ----------------------------------------
// App.tsx — Wait...What? News App (WITH AUTH)
// ----------------------------------------

import React, { useState, useEffect } from "react";
import { Text, View } from "react-native";

import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  useNavigationContainerRef,
} from "@react-navigation/native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";

import { useFonts } from "expo-font";
import { colors, getThemeColors, fonts } from "./styles/theme";

// 🔐 AUTH
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./utils/firebase";

// Screens
import HomeScreen from "./screens/HomeScreen";
import StoriesScreen from "./screens/StoriesScreen";
import ThemesScreen from "./screens/ThemesScreen";
import StoryScreen from "./screens/StoryScreen";
import ThemeScreen from "./screens/ThemeScreen";
import AnalysisModalScreen from "./screens/AnalysisModalScreen";
import EventReaderModal from "./screens/EventReaderModal";
import SavedScreen from "./screens/SavedScreen";
import SearchScreen from "./screens/SearchScreen";
import WhatIsWaitWhatScreen from "./screens/WhatIsWaitWhatScreen";
import ContactUsScreen from "./screens/ContactUsScreen";
import LoginScreen from "./screens/LoginScreen";

import { getStorySearchCache } from "./utils/storyCache";
import { UserDataProvider, useUserData } from "./contexts/UserDataContext";
import { track } from "./utils/analytics";

// ----------------------------------------
// Navigation setup
// ----------------------------------------

type RootTabParamList = {
  HomeTab: undefined;
  StoriesTab: undefined;
  ThemesTab: undefined;
  SavedTab: undefined;
};

type RootStackParamList = {
  Login: undefined;
  RootTabs: undefined;
  Story: { id: string };
  Theme: { id: string };
  Search: { query?: string };
  AnalysisModal: undefined;
  EventReader: undefined;
  WhatIsWaitWhat: undefined;
  ContactUs: undefined;
};


const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();


const prefix = Linking.createURL("/");
const linking = {
  prefixes: [prefix, "wwfinal://"],
  config: {
    screens: {
      Login: "login",
      RootTabs: {
        screens: {
          HomeTab: "home",
          StoriesTab: "stories",
          ThemesTab: "themes",
          SavedTab: "saved",
        },
      },
      Story: "story/:id",
      Theme: "theme/:id",
      Search: "search",
      AnalysisModal: "analysis",
      EventReader: "event",
      WhatIsWaitWhat: "about",
      ContactUs: "contact",
    },
  },
};

// ----------------------------------------
// Tabs
// ----------------------------------------

function Tabs() {
  const userData = useUserData();
if (!userData) return null;

const { themeColors, savedUpdatesCount } = userData;
const palette = themeColors || getThemeColors(false);

  return (
    <Tab.Navigator id={undefined}

      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          height: 60,
          paddingBottom: 5,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "ellipse-outline";


          if (route.name === "HomeTab") iconName = "home-outline";
          else if (route.name === "StoriesTab") iconName = "newspaper-outline";
          else if (route.name === "ThemesTab") iconName = "compass-outline";
          else if (route.name === "SavedTab") iconName = "bookmark-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: {
  fontSize: 12,
  fontWeight: "500",
},

      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="StoriesTab" component={StoriesScreen} options={{ title: "Stories" }} />
      <Tab.Screen name="ThemesTab" component={ThemesScreen} options={{ title: "Themes" }} />
      <Tab.Screen
        name="SavedTab"
        component={SavedScreen}
        options={{
          title: "Saved",
          tabBarBadge: savedUpdatesCount > 0 ? savedUpdatesCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: palette.accent,
            color: palette.surface,
          },
        }}
      />
    </Tab.Navigator>
  );
}

// ----------------------------------------
// Navigation themes
// ----------------------------------------

const LightNavTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: "#FFFFFF",
    card: "#FFFFFF",
    text: "#111827",
  },
};

const DarkNavTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    background: "#000000",
    card: "#0A0A0A",
    border: "#1A1A1A",
    text: "#F3F4F6",
  },
};

// ----------------------------------------
// App Navigator
// ----------------------------------------

function AppNavigator({ user }: { user: any }) {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  const { darkMode } = useUserData();

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        theme={darkMode ? DarkNavTheme : LightNavTheme}
        linking={linking}
      >
        {!user ? (
         <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>



            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="RootTabs"
              component={Tabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Story" component={StoryScreen} />
            <Stack.Screen name="Theme" component={ThemeScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
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
            <Stack.Screen
              name="WhatIsWaitWhat"
              component={WhatIsWaitWhatScreen}
              options={{ title: "What is Wait...What?" }}
            />
            <Stack.Screen
              name="ContactUs"
              component={ContactUsScreen}
              options={{ title: "Contact Us" }}
            />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </>
  );
}

// ----------------------------------------
// Root App
// ----------------------------------------

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecking(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
  track("app_open");
}, []);


  const [fontsLoaded] = useFonts({
    Barrio: require("./assets/fonts/Barrio-Regular.ttf"),
    FreckleFace: require("./assets/fonts/FreckleFace-Regular.ttf"),
    YujiBoku: require("./assets/fonts/YujiBoku-Regular.ttf"),
    RubikDirt: require("./assets/fonts/RubikDirt-Regular.ttf"),
    IMFellGreatPrimerSC: require("./assets/fonts/IMFellGreatPrimerSC-Regular.ttf"),
  });

  if (!fontsLoaded || authChecking) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Loading app…</Text>
    </View>
  );
}


  return (
    <UserDataProvider user={user}>
      <AppNavigator user={user} />
    </UserDataProvider>
  );
}

// ----------------------------------------
// Styles
// ----------------------------------------
