// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCWheUVa3M_nMOPS4qc_o_hOYtNZS-zXq4",
  authDomain: "scan-frame.firebaseapp.com",
  projectId: "scan-frame",
  storageBucket: "scan-frame.firebasestorage.app",
  messagingSenderId: "115026459022",
  appId: "1:115026459022:web:62bc77107724aa5ff7ccdf",
  measurementId: "G-TZBVJ6VV69"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Save user to backend
export async function saveUserToBackend({ uid, name, email, provider, picture }) {
  try {
    const res = await fetch('/api/save_user', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, name, email, provider, picture }),
    });
    return await res.json();
  } catch (err) {
    console.error("Backend error:", err);
    return { status: "error", message: err.message };
  }
}

export async function fetchUserFromBackend(uid) {
  try {
    const res = await fetch(`/api/get_user?uid=${uid}`);
    if (!res.ok) throw new Error("Failed to fetch user");
    const data = await res.json();

    if (data.status === "success") {
      return {
        uid: data.user.uid,
        name: data.user.name,
        email: data.user.email,
        provider: data.user.provider,
        picture: data.user.picture,
      };
    } else {
      throw new Error(data.message || "User not found");
    }
  } catch (err) {
    console.error("Backend fetch error:", err);
    return null;
  }
}