import { initializeApp } from "firebase/app";
//@ts-ignore - getReactNativePersistence existe no bundle React Native
import { initializeAuth, getReactNativePersistence, browserLocalPersistence} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import {Platform} from "react-native"

const firebaseConfig = {
  apiKey: "AIzaSyApBq3rACuMoON2rs390rZNR0_Tvxy_iY4",
  authDomain: "equalpay-cff9b.firebaseapp.com",
  projectId: "equalpay-cff9b",
  storageBucket: "equalpay-cff9b.firebasestorage.app",
  messagingSenderId: "686551527248",
  appId: "1:686551527248:web:7171e77d2c3762d1d1c655",
  measurementId: "G-0W7EPQT0MM"
};
const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: 
    Platform.OS === "web"
      ? browserLocalPersistence
      : getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { app, auth, db };
