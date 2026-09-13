/**
 * NIVA — Firebase Web Client SDK Configuration & Real-time Firestore Service.
 * Project: niva-banking-daiict
 */

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  Firestore, 
  doc, 
  collection, 
  onSnapshot, 
  getDoc, 
  getDocs, 
  setDoc,
  Unsubscribe,
  DocumentData 
} from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "niva-banking-daiict.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "niva-banking-daiict",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "niva-banking-daiict.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "36229979845",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:36229979845:web:eba8407d43515f58d59aac"
};

// Safe singleton initialization for Next.js (client & SSR)
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

/**
 * Real-time listener for a single document (e.g. users/{persona_id}, financial_twins/{persona_id})
 */
export function subscribeToDocument(
  collectionName: string, 
  docId: string, 
  onData: (data: DocumentData | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(
    docRef, 
    (snap) => {
      if (snap.exists()) {
        onData(snap.data());
      } else {
        onData(null);
      }
    },
    (err) => {
      console.warn(`[NIVA Firebase] Snapshot error for ${collectionName}/${docId}:`, err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for a collection (e.g. users, bank_schemes, audit_entries)
 */
export function subscribeToCollection(
  collectionName: string,
  onData: (items: DocumentData[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      onData(items);
    },
    (err) => {
      console.warn(`[NIVA Firebase] Snapshot error for ${collectionName}:`, err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch a single document once
 */
export async function getDocumentData(collectionName: string, docId: string): Promise<DocumentData | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn(`[NIVA Firebase] getDoc error for ${collectionName}/${docId}:`, err);
    return null;
  }
}

export default app;
