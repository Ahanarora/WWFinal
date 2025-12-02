// ----------------------------------------
// screens/LoginScreen.js — Wait...What? (With Skip Login)
// ----------------------------------------
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const continueWithoutLogin = () => {
    // Navigate directly to Tabs by replacing Login
    navigation.replace("RootTabs");
  };

  return (
    <View style={styles.container}>
      {/* TITLE */}
      <Text style={styles.title}>Wait...What?</Text>
      <Text style={styles.subtitle}>Sign in or continue as guest</Text>

      {/* CARD */}
      <View style={styles.card}>
        {/* EMAIL */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#6B7280" />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        {/* PASSWORD */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        {/* LOGIN BUTTON */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={login}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? "Signing In..." : "Sign In"}
          </Text>
        </TouchableOpacity>

        {/* OR DIVIDER */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        {/* GOOGLE SIGN-IN */}
        <TouchableOpacity style={styles.googleButton}>
          <Ionicons name="logo-google" size={20} color="#DB4437" />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* APPLE SIGN-IN (iOS only) */}
        {Platform.OS === "ios" && (
          <TouchableOpacity style={styles.appleButton}>
            <Ionicons name="logo-apple" size={20} color="#000" />
            <Text style={styles.appleButtonText}>Sign in with Apple</Text>
          </TouchableOpacity>
        )}

        {/* CONTINUE WITHOUT LOGIN */}
        <TouchableOpacity onPress={continueWithoutLogin} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Continue without signing in →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ----------------------------------------
// STYLES
// ----------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 44,
    fontFamily: "Jacquard24",
    textAlign: "center",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  input: {
    marginLeft: 10,
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  loginButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 8,
    color: "#6B7280",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  googleButtonText: {
    marginLeft: 10,
    color: "#111827",
    fontSize: 15,
    fontWeight: "500",
  },
  appleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 10,
  },
  appleButtonText: {
    marginLeft: 10,
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  skipButton: {
    marginTop: 22,
    paddingVertical: 10,
  },
  skipButtonText: {
    textAlign: "center",
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },
});
