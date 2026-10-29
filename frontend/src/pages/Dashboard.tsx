import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGoals, useMeals } from "../hooks/useData";
import { addDays, dayKey, startOfDay, sumMeals } from "../services/nutrition";
import { Empty, ErrorBox, PageHeader, ProgressBar, Skeleton } from "../components/ui";

export default function Dashboard() {
  const { user } = useAuth();
  const today = startOfDay(new Date());
  const weekStart = addDays(today, -6), end = addDays(today, 1);
  const { meals, loading, error } = useMeals(weekStart, end);
  const { goals } = useGoals();

  const todayMeals = meals.filter((m) => dayKey(m.eatenAt) === dayKey(today));
  const t = sumMeals(todayMeals);
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const s = sumMeals(meals.filter((m) => dayKey(m.eatenAt) === dayKey(d)));
    return { day: d.toLocaleDateString(undefined, { weekday: "short" }), ...s };
  }), [meals, weekStart.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const cards = [
    { label: "Calories", v: t.calories, g: goals.calorieTarget, u: "kcal" },
    { label: "Protein", v: t.protein, g: goals.proteinTarget, u: "g" },
    { label: "Carbohydrates", v: t.carbohydrates, g: goals.carbohydrateTarget, u: "g" },
    { label: "Fat", v: t.fat, g: goals.fatTarget, u: "g" },
  ];
  return (
    <>
      <PageHeader title={`Hello, ${user?.displayName?.split(" ")[0] ?? "there"}`}
        sub={today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} />
      {error && <ErrorBox>{error}</ErrorBox>}
      {loading ? <div className="grid4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} />)}</div> : (
        <div className="grid4">
          {cards.map((c) => (
            <section className="card stat" key={c.label}>
              <h2 className="small muted">{c.label}</h2>
              <p className="big">{c.v}<span className="unit"> {c.u}</span></p>
              <ProgressBar value={c.v} max={c.g} label={`${c.label} progress`} />
              <p className="small muted">{c.g - c.v >= 0 ? `${Math.round((c.g - c.v) * 10) / 10} ${c.u} left of ${c.g}` : `${Math.round((c.v - c.g) * 10) / 10} ${c.u} over ${c.g}`}</p>
            </section>
          ))}
        </div>
      )}
      {!loading && todayMeals.length === 0 && (
        <Empty title="Nothing logged today">Add your first meal from the <Link to="/scanner">Scanner</Link> or the <Link to="/diary">Diary</Link>.</Empty>
      )}
      <div className="grid2">
        <section className="card"><h2>Calories this week</h2>
          <div className="chart"><ResponsiveContainer>
            <BarChart data={week}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" /><YAxis width={40} />
              <Tooltip /><Bar dataKey="calories" name="Calories" fill="#2f8f5b" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer></div></section>
        <section className="card"><h2>Macros this week (g)</h2>
          <div className="chart"><ResponsiveContainer>
            <LineChart data={week}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" /><YAxis width={40} /><Tooltip /><Legend />
              <Line type="monotone" dataKey="protein" name="Protein" stroke="#2f8f5b" strokeWidth={2} />
              <Line type="monotone" dataKey="carbohydrates" name="Carbs" stroke="#d29a2b" strokeWidth={2} />
              <Line type="monotone" dataKey="fat" name="Fat" stroke="#6b7a90" strokeWidth={2} /></LineChart>
          </ResponsiveContainer></div></section>
      </div>
    </>
  );
}
