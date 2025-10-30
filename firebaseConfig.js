import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBjOeHP4Pst7BYyRF2c85KKMe6lifXOU1M",
  authDomain: "wwconsole-93f76.firebaseapp.com",
  projectId: "wwconsole-93f76",
  storageBucket: "wwconsole-93f76.appspot.com",
  messagingSenderId: "936183161335",
  appId: "1:936183161335:web:0762f9ac5837ada128cef2",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
