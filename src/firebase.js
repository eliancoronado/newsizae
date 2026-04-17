// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getMessaging } from "firebase/messaging";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfKGy9qWaQP9-_fgP9fWxM5C19Tb7I8lg",
  authDomain: "sizaenew.firebaseapp.com",
  projectId: "sizaenew",
  storageBucket: "sizaenew.firebasestorage.app",
  messagingSenderId: "116825955089",
  appId: "1:116825955089:web:b7b269ee09dbb000e1cab0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getDatabase(app);
export const messaging = getMessaging(app);
export const storage = getStorage(app);