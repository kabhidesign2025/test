// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCt-ATwXIxAFQliU3Y5g1a1DmYnxFFokkY",
  authDomain: "the-art-foundation-portal.firebaseapp.com",
  projectId: "the-art-foundation-portal",
  storageBucket: "the-art-foundation-portal.firebasestorage.app",
  messagingSenderId: "415205532308",
  appId: "1:415205532308:web:a7bd12c6dde57267b20a81",
  measurementId: "G-EHD9VF1LMN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Export services for use in your app
export { auth, db };