import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7hUQmsPeJcEdxPSI4o1B9EVfgEHn5Frc",
  authDomain: "pdstimestamp.firebaseapp.com",
  projectId: "pdstimestamp",
  storageBucket: "pdstimestamp.firebasestorage.app",
  messagingSenderId: "1085696383633",
  appId: "1:1085696383633:web:0fbe8f845b6b98675abd30",
  measurementId: "G-FKPSJ0EQFD"
};

// Initialize Firebase (ทำให้ Firebase เริ่มต้นครั้งเดียว)
const app = initializeApp(firebaseConfig);

// Export Firebase services เพื่อให้ทุกไฟล์ใช้ได้โดยไม่ต้อง `import` ซ้ำ
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
