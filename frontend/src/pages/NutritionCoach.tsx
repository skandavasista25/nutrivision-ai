
import { useMemo } from "react";
import { useMeals, useGoals } from "../hooks/useData";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui";
import {
  Brain, Flame, Beef, Wheat, Droplets,
  Lightbulb, TrendingUp
} from "lucide-react";

export default function NutritionCoach() {
  const { user } = useAuth();
  const { goals, loading: goalsLoading } = useGoals();

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { meals, loading: mealsLoading, error } = useMeals(start, end);

  const totals = useMemo(() => meals.reduce(
    (sum, meal) => ({
      calories: sum.calories + meal.calories,
      protein: sum.protein + meal.protein,
      carbohydrates: sum.carbohydrates + meal.carbohydrates,
      fat: sum.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0 }
  ), [meals]);

  const recommendations = useMemo(() => {
    const tips: string[] = [];

    if (totals.protein < goals.proteinTarget * 0.5) {
      tips.push("Your protein intake is currently below half your daily target. Consider dal, paneer, eggs or curd.");
    }

    if (totals.calories < goals.calorieTarget * 0.5) {
      tips.push("Your calorie intake is currently below half your daily target. Consider having a balanced meal if you haven't eaten yet.");
    }

    if (totals.fat > goals.fatTarget) {
      tips.push("Your fat intake has exceeded your daily target. Consider lighter food choices for your next meal.");
    }

    if (totals.carbohydrates > goals.carbohydrateTarget) {
      tips.push("Your carbohydrate intake has exceeded your daily target. Consider balancing your next meal with protein and vegetables.");
    }

    if (tips.length === 0) {
      tips.push("Your nutrition is looking balanced against your current targets. Continue recording your meals to get better recommendations.");
    }

    return tips;
  }, [totals, goals]);

  const stats = [
    { label: "Calories", value: totals.calories, target: goals.calorieTarget, icon: Flame, unit: "kcal" },
    { label: "Protein", value: totals.protein, target: goals.proteinTarget, icon: Beef, unit: "g" },
    { label: "Carbs", value: totals.carbohydrates, target: goals.carbohydrateTarget, icon: Wheat, unit: "g" },
    { label: "Fat", value: totals.fat, target: goals.fatTarget, icon: Droplets, unit: "g" },
  ];

  if (!user) return <p>Please sign in to use your Nutrition Coach.</p>;

  return (
    <>
      <PageHeader
        title="AI Nutrition Coach"
        sub="Personalized nutrition insights based on your daily food diary."
      />

      {(mealsLoading || goalsLoading) && <p>Analyzing your nutrition...</p>}
      {error && <div className="alert error">{error}</div>}

      {!mealsLoading && !goalsLoading && (
        <>
          <section className="card">
            <div className="row2">
              <div>
                <h2><Brain size={20} /> Your daily nutrition analysis</h2>
                <p className="muted small">
                  Based on {meals.length} meals recorded today.
                </p>
              </div>
              <TrendingUp size={28} />
            </div>

            <div className="grid2">
              {stats.map(({ label, value, target, icon: Icon, unit }) => {
                const percentage = target > 0
                  ? Math.round((value / target) * 100)
                  : 0;

                return (
                  <div className="nutrition-stat" key={label}>
                    <div className="stat-top">
                      <Icon size={20} />
                      <span>{label}</span>
                    </div>
                    <h2>{value.toFixed(1)} {unit}</h2>
                    <p className="muted small">
                      Target: {target} {unit}
                    </p>
                    <div className="calorie-track">
                      <div
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          height: "100%",
                          background: "#2F8050",
                          borderRadius: "inherit",
                        }}
                      />
                    </div>
                    <p className="small">{percentage}% of target</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card" style={{ marginTop: 20 }}>
            <h2><Lightbulb size={20} /> Your personalized recommendations</h2>

            {recommendations.map((tip, index) => (
              <div className="alert info" key={index}>
                {tip}
              </div>
            ))}
          </section>

          <section className="card" style={{ marginTop: 20 }}>
            <h2>Today's food diary</h2>
            {meals.length === 0 ? (
              <p className="muted">
                No meals recorded today. Add a meal using Food Scanner to receive personalized advice.
              </p>
            ) : (
              meals.map((meal) => (
                <div
                  key={meal.id}
                  className="row2"
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <strong>{meal.foodName}</strong>
                    <p className="muted small">
                      {meal.mealType} · {meal.portionGrams} g
                    </p>
                  </div>
                  <strong>{meal.calories} kcal</strong>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </>
  );
}
