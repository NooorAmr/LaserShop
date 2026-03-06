// ============================================================
// products.js — Product CRUD operations with Firestore
// ============================================================
import { db } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, onSnapshot, orderBy, query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const COLLECTION = "products";

// ── Real-time listener: calls callback(products[]) on every change ──────────
export function listenToProducts(callback) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(products);
  });
}

// ── One-time fetch (used in admin) ──────────────────────────────────────────
export async function fetchProducts() {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Add a new product ───────────────────────────────────────────────────────
export async function addProduct(data) {
  return await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: Date.now()
  });
}

// ── Update an existing product ──────────────────────────────────────────────
export async function updateProduct(id, data) {
  return await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: Date.now()
  });
}

// ── Delete a product ────────────────────────────────────────────────────────
export async function deleteProduct(id) {
  return await deleteDoc(doc(db, COLLECTION, id));
}
