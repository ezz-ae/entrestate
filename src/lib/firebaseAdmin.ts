
// Server-side only Firebase Admin singletons. Deliberately NOT a 'use server'
// module: that directive is for Server Actions and forbids object exports.

import { getApps, initializeApp, applicationDefault, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
if (!getApps().length) {
  app = initializeApp({
    // On GCP this picks up the ambient SA. Locally you can also use cert(...) via env JSON.
    credential: applicationDefault(),
  });
} else {
  app = getApps()[0]!;
}

export const adminApp: App = app;
export const adminAuth: Auth = getAuth(app);        // ✅ non-null
export const adminDb: Firestore = getFirestore(app); // ✅ non-null
