// ----------------------------------------
// App.js — Wait...What? News App (WITH AUTH)
// ----------------------------------------
import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
} from "react-native";
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
import { colors, getThemeColors } from "./styles/theme";

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
import SavedScreen from "./screens/SavedScreen";
import SearchScreen from "./screens/SearchScreen";
import { getStorySearchCache } from "./utils/storyCache";
import WhatIsWaitWhatScreen from "./screens/WhatIsWaitWhatScreen";
import ContactUsScreen from "./screens/ContactUsScreen";

// 👉 You must create this file:
//    /screens/LoginScreen.js
import LoginScreen from "./screens/LoginScreen";
import {
  UserDataProvider,
  useUserData,
} from "./contexts/UserDataContext";

// Tabs and Stack
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
        },
      },
      Story: "story/:id",
      Theme: "theme/:id",
      Saved: "saved",
      Search: "search",
      AnalysisModal: "analysis",
      EventReader: "event",
      WhatIsWaitWhat: "about",
      ContactUs: "contact",
    },
  },
};

// ----------------------------------------
// 🧭 Tab Navigation
// ----------------------------------------
function Tabs() {
  const { themeColors } = useUserData();
  const palette = themeColors || getThemeColors(false);
  return (
    <Tab.Navigator
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
    background: "#050505",
    card: "#111827",
    border: "#1f2937",
    text: "#F3F4F6",
  },
};

function MenuSheet({
  visible,
  onClose,
  onOpenSaved,
  onOpenAbout,
  onOpenContact,
  darkMode,
  onToggleDarkMode,
  onLogout,
  user,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <Pressable style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Menu</Text>
          {user ? (
            <Text style={styles.menuSubtitle}>
              Signed in as {user.email || user.uid}
            </Text>
          ) : (
            <Text style={styles.menuSubtitle}>Not signed in</Text>
          )}

          <TouchableOpacity style={styles.menuOption} onPress={onLogout}>
            <Ionicons
              name="log-out-outline"
              size={18}
              style={styles.menuOptionIcon}
            />
            <Text style={styles.menuOptionText}>Log out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuOption} onPress={onOpenSaved}>
            <Ionicons name="bookmark" size={18} style={styles.menuOptionIcon} />
            <Text style={styles.menuOptionText}>Saved</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuOption} onPress={onOpenAbout}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              style={styles.menuOptionIcon}
            />
            <Text style={styles.menuOptionText}>What is Wait...What?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuOption} onPress={onOpenContact}>
            <Ionicons
              name="mail-outline"
              size={18}
              style={styles.menuOptionIcon}
            />
            <Text style={styles.menuOptionText}>Contact Us</Text>
          </TouchableOpacity>

          <View style={[styles.menuOption, styles.menuToggleRow]}>
            <Ionicons name="moon" size={18} style={styles.menuOptionIcon} />
            <Text style={styles.menuOptionText}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={onToggleDarkMode}
              style={{ marginLeft: "auto" }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AppNavigator({ user }) {
  const navigationRef = useNavigationContainerRef();
  const { darkMode, toggleDarkMode } = useUserData();
  const [menuVisible, setMenuVisible] = useState(false);
  const WaitHeader = ({ onPress }) => {
    const textColor = darkMode ? "#f8fafc" : colors.textPrimary;
    const accentColor = "#DC2626";
    const underlineColor = "#FACC15";

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{ paddingHorizontal: 4 }}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoRow}>
            <Text style={[styles.logoWord, { color: textColor }]}>Wait</Text>
            <Text style={[styles.logoDots, { color: textColor }]}>...</Text>
            <View style={[styles.logoOval, { borderColor: accentColor }]}>
              <Text style={[styles.logoOvalText, { color: textColor }]}>
                What?
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.logoUnderline,
              { backgroundColor: underlineColor },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const navigateHome = (navigation) => {
    navigation.navigate("RootTabs", { screen: "HomeTab" });
  };

  const openSearch = (navigation) => {
    navigation.navigate("Search", { stories: getStorySearchCache() });
  };

  const screenOptions = ({ navigation }) => ({
    headerTitleAlign: "center",
    headerStyle: {
      backgroundColor: darkMode ? "#0f172a" : "#fff",
    },
    headerTintColor: darkMode ? "#f8fafc" : "#111827",
    headerTitle: () => (
      <WaitHeader onPress={() => navigateHome(navigation)} />
    ),
    headerRight: () => (
      <TouchableOpacity
        onPress={() => openSearch(navigation)}
        style={{ paddingLeft: 12 }}
      >
        <Ionicons
          name="search"
          size={22}
          color={darkMode ? "#f8fafc" : "#111827"}
        />
      </TouchableOpacity>
    ),
  });

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleOpenSaved = () => {
    closeMenu();
    navigationRef.current?.navigate("Saved");
  };

  const handleOpenAbout = () => {
    closeMenu();
    navigationRef.current?.navigate("WhatIsWaitWhat");
  };

  const handleOpenContact = () => {
    closeMenu();
    navigationRef.current?.navigate("ContactUs");
  };

  const handleLogout = () => {
    auth.signOut();
    setMenuVisible(false);
  };

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        theme={darkMode ? DarkNavTheme : LightNavTheme}
        linking={linking}
      >
        {!user ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen
              name="RootTabs"
              component={Tabs}
              options={{
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={openMenu}
                    style={{ paddingRight: 16, paddingVertical: 4 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="menu"
                      size={28}
                      color={darkMode ? "#f8fafc" : "#111827"}
                    />
                  </TouchableOpacity>
                ),
              }}
            />

            <Stack.Screen
              name="Story"
              component={StoryScreen}
              options={{ headerBackTitle: "Back" }}
            />

            <Stack.Screen
              name="Theme"
              component={ThemeScreen}
              options={{ headerBackTitle: "Back" }}
            />

            <Stack.Screen
              name="Saved"
              component={SavedScreen}
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

            <Stack.Screen
              name="Search"
              component={SearchScreen}
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

      <MenuSheet
        visible={menuVisible}
        onClose={closeMenu}
        onOpenSaved={handleOpenSaved}
        onOpenAbout={handleOpenAbout}
        onOpenContact={handleOpenContact}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
          user={user}
        onLogout={handleLogout}
      />
    </>
  );
}

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

  if (!fontsLoaded || authChecking) return null;

  return (
    <UserDataProvider user={user}>
      <AppNavigator user={user} />
    </UserDataProvider>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoWord: {
    fontFamily: "Jacquard24",
    fontSize: 44,
  },
  logoDots: {
    fontFamily: "Jacquard24",
    fontSize: 36,
    marginHorizontal: 2,
  },
  logoOval: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "-3deg" }],
  },
  logoOvalText: {
    fontFamily: "Jacquard24",
    fontSize: 42,
    lineHeight: 44,
  },
  logoUnderline: {
    marginTop: 4,
    height: 2,
    borderRadius: 4,
    alignSelf: "center",
    width: "100%",
    maxWidth: 260,
    minWidth: 140,
    transform: [{ rotate: "-2deg" }],
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  menuContainer: {
    width: "70%",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomRightRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 40,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 20,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuOptionIcon: {
    marginRight: 10,
    color: colors.textPrimary,
  },
  menuOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  menuToggleRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    marginTop: 8,
  },
});
