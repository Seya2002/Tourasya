import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAf3gloqgGQuEaATmWjI5C19DOajlqw0iI",
  authDomain: "tourasya-6b68b.firebaseapp.com",
  projectId: "tourasya-6b68b",
  storageBucket: "tourasya-6b68b.firebasestorage.app",
  messagingSenderId: "384843517318",
  appId: "1:384843517318:web:c4da98c3ac7407de113007"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Helper to create a temporary secondary app/auth so that creating a user
// does not switch the current session (admin stays logged in)
export const createSecondaryAuth = (): { app: FirebaseApp; auth: Auth; cleanup: () => Promise<void> } => {
  const name = `secondary-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, name);
  const secondaryAuth = getAuth(secondaryApp);

  const cleanup = async () => {
    try {
      // Ensure any session on the secondary auth is cleared, then delete the app
      await secondaryAuth.signOut().catch(() => {});
      await deleteApp(secondaryApp);
    } catch {
      // ignore
    }
  };

  return { app: secondaryApp, auth: secondaryAuth, cleanup };
};