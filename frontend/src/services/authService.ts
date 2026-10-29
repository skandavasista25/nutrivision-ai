import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, updateProfile, deleteUser,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { createUserProfile } from "./firestoreService";

export function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Email or password is incorrect.";
    case "auth/invalid-email": return "Enter a valid email address.";
    case "auth/email-already-in-use": return "An account with this email already exists. Try logging in.";
    case "auth/weak-password": return "Password is too weak. Use at least 8 characters.";
    case "auth/too-many-requests": return "Too many attempts. Wait a few minutes and try again.";
    case "auth/network-request-failed": return "Network error. Check your connection and try again.";
    case "auth/operation-not-allowed": return "Email/password sign-in is not enabled for this Firebase project.";
    case "permission-denied": return "The profile could not be saved. Check that the Firestore rules are deployed.";
    default: return "Something went wrong. Please try again.";
  }
}

export async function signup(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await updateProfile(cred.user, { displayName: name });
    await createUserProfile(cred.user.uid, name, email);
  } catch (e) {
    // Roll back so an account never exists without its profile document.
    await deleteUser(cred.user).catch(() => undefined);
    throw e;
  }
  return cred.user;
}
export const login = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);
