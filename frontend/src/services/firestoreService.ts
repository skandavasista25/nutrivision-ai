import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp,
  setDoc, Timestamp, updateDoc, where, type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { DEFAULT_GOALS, DEFAULT_PREFS, type Goals, type Meal, type MealInput, type Preferences, type UserProfile } from "../types";

const userDoc = (uid: string) => doc(db, "users", uid);
const mealsCol = (uid: string) => collection(db, "users", uid, "meals");
const goalDoc = (uid: string) => doc(db, "users", uid, "goals", "current");

export async function createUserProfile(uid: string, displayName: string, email: string) {
  await setDoc(userDoc(uid), {
    displayName, email, createdAt: serverTimestamp(),
    preferences: DEFAULT_PREFS, nutritionGoals: DEFAULT_GOALS,
  });
  await setDoc(goalDoc(uid), { ...DEFAULT_GOALS, updatedAt: serverTimestamp() });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const s = await getDoc(userDoc(uid));
  return s.exists() ? (s.data() as UserProfile) : null;
}

export async function updateProfileSettings(uid: string, displayName: string, preferences: Preferences) {
  await updateDoc(userDoc(uid), { displayName, preferences });
}

export async function saveGoals(uid: string, goals: Goals) {
  await setDoc(goalDoc(uid), { ...goals, updatedAt: serverTimestamp() });
  await updateDoc(userDoc(uid), { nutritionGoals: goals });
}

export function subscribeGoals(uid: string, cb: (g: Goals) => void, onErr: (e: Error) => void): Unsubscribe {
  return onSnapshot(goalDoc(uid), (s) => {
    const d = s.data();
    cb(d ? {
      calorieTarget: d.calorieTarget, proteinTarget: d.proteinTarget,
      carbohydrateTarget: d.carbohydrateTarget, fatTarget: d.fatTarget,
    } : DEFAULT_GOALS);
  }, onErr);
}

export async function addMeal(uid: string, m: MealInput) {
  const { eatenAt, ...rest } = m;
  await addDoc(mealsCol(uid), { ...rest, eatenAt: Timestamp.fromDate(eatenAt), createdAt: serverTimestamp() });
}

export async function updateMeal(uid: string, id: string, patch: Partial<Omit<MealInput, "eatenAt">>) {
  await updateDoc(doc(mealsCol(uid), id), patch);
}

export const deleteMeal = (uid: string, id: string) => deleteDoc(doc(mealsCol(uid), id));

/** Live meals whose eatenAt falls in [start, end). */
export function subscribeMeals(uid: string, start: Date, end: Date, cb: (m: Meal[]) => void, onErr: (e: Error) => void): Unsubscribe {
  const q = query(mealsCol(uid), where("eatenAt", ">=", Timestamp.fromDate(start)),
    where("eatenAt", "<", Timestamp.fromDate(end)), orderBy("eatenAt", "asc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id, foodName: x.foodName, mealType: x.mealType, portionGrams: x.portionGrams,
      calories: x.calories, protein: x.protein, carbohydrates: x.carbohydrates, fat: x.fat,
      eatenAt: (x.eatenAt as Timestamp).toDate(), createdAt: x.createdAt ? (x.createdAt as Timestamp).toDate() : null,
    } as Meal;
  })), onErr);
}
