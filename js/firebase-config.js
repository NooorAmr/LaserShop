// ============================================================
// firebase-config.js — Shared Firebase initialization
// ============================================================
// ⚠️ استبدل القيم دي بإعدادات مشروعك على Firebase
// Project Settings → General → Your Apps → Web App → Config

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ⬇️ ضع إعدادات Firebase هنا
const firebaseConfig = {
  apiKey:            "AIzaSyA1--JbOZPzEtO62-Dtok4ufI-0M4z55yg",
  authDomain:        "lasershop-c62f1.firebaseapp.com",
  projectId:         "lasershop-c62f1",
  storageBucket:     "lasershop-c62f1.firebasestorage.app",
  messagingSenderId: "893934150463",
  appId:             "1:893934150463:web:42bd572385e7577b36a98a"
};

const app = initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);
// ملاحظة: لا نحتاج Firebase Storage — الصور بترفع على imgbb.com مجاناً
