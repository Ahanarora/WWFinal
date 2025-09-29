// utils/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA96B-6oco_h60zQXrj9AHlKtvBSATUDPg",
  authDomain: "wwfinal-3abca.firebaseapp.com",
  projectId: "wwfinal-3abca",
  storageBucket: "wwfinal-3abca.firebasestorage.app",
  messagingSenderId: "440890389815",
  appId: "1:440890389815:web:03865d433c25effdf996b2",
  measurementId: "G-KWFG2H4M8X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// --- One-time fetch (on demand) ---
export async function fetchStories() {
  const snapshot = await getDocs(collection(db, "stories"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function fetchThemes() {
  const snapshot = await getDocs(collection(db, "themes"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// --- Realtime subscription (auto updates when Firebase changes) ---
export function listenToStories(callback) {
  return onSnapshot(collection(db, "stories"), (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
}

export function listenToThemes(callback) {
  return onSnapshot(collection(db, "themes"), (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
}
