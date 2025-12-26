// utils/firebase.js
// Canonical Firebase initialization for WWFinal (React Native / Expo)

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// ✅ React Native Auth (with persistence)
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --------------------------------------------------
// Firebase config
// --------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyBjOeHP4Pst7BYyRF2c85KKMe6lifXOU1M",
  authDomain: "wwconsole-93f76.firebaseapp.com",
  projectId: "wwconsole-93f76",
  storageBucket: "wwconsole-93f76.appspot.com",
  messagingSenderId: "936183161335",
  appId: "1:936183161335:web:0762f9ac5837ada128cef2",
  measurementId: "G-H6R483JTGT",
};

// --------------------------------------------------
// Initialize app
// --------------------------------------------------

export const app = initializeApp(firebaseConfig);

// --------------------------------------------------
// Auth — React Native persistence (CRITICAL FIX)
// --------------------------------------------------

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// --------------------------------------------------
// Firestore & Functions
// --------------------------------------------------

export const db = getFirestore(app);
export const functions = getFunctions(app, "asia-south1");
