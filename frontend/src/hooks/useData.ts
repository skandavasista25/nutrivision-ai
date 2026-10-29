import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscribeGoals, subscribeMeals } from "../services/firestoreService";
import { DEFAULT_GOALS, type Goals, type Meal } from "../types";

/** Live meals in [start, end) for the signed-in user. */
export function useMeals(start: Date, end: Date) {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const s = start.getTime(), e = end.getTime();
  useEffect(() => {
    if (!user) return;
    setLoading(true); setError(null);
    return subscribeMeals(user.uid, new Date(s), new Date(e),
      (m) => { setMeals(m); setLoading(false); },
      () => { setError("Could not load your meals. Check your connection and Firestore rules."); setLoading(false); });
  }, [user, s, e]);
  return { meals, loading, error };
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    return subscribeGoals(user.uid, (g) => { setGoals(g); setLoading(false); }, () => setLoading(false));
  }, [user]);
  return { goals, loading };
}
