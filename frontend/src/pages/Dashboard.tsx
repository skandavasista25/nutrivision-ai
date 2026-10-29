
import { useMemo } from "react";
import {
  Activity,
  ArrowRight,
  Camera,
  Flame,
  Leaf,
  Plus,
  Target,
  TrendingUp,
  Utensils,
  Beef,
  Wheat,
  Droplets,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGoals, useMeals } from "../hooks/useData";
import {
  addDays,
  dayKey,
  startOfDay,
  sumMeals,
} from "../services/nutrition";
import {
  Empty,
  ErrorBox,
  PageHeader,
  ProgressBar,
  Skeleton,
} from "../components/ui";

export default function Dashboard() {
  const { user } = useAuth();
  const today = startOfDay(new Date());
  const weekStart = addDays(today, -6);
  const end = addDays(today, 1);

  const { meals, loading, error } = useMeals(weekStart, end);
  const { goals } = useGoals();

  const todayMeals = meals.filter(
    (m) => dayKey(m.eatenAt) === dayKey(today)
  );
  const totals = sumMeals(todayMeals);

  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i);
        const summary = sumMeals(
          meals.filter((m) => dayKey(m.eatenAt) === dayKey(date))
        );

        return {
          day: date.toLocaleDateString(undefined, {
            weekday: "short",
          }),
          ...summary,
        };
      }),
    [meals, weekStart.getTime()]
  );

  const cards = [
    {
      label: "Calories",
      value: totals.calories,
      goal: goals.calorieTarget,
      unit: "kcal",
      icon: Flame,
      color: "#A8E6A0",
    },
    {
      label: "Protein",
      value: totals.protein,
      goal: goals.proteinTarget,
      unit: "g",
      icon: Beef,
      color: "#80C9B0",
    },
    {
      label: "Carbohydrates",
      value: totals.carbohydrates,
      goal: goals.carbohydrateTarget,
      unit: "g",
      icon: Wheat,
      color: "#E7BE79",
    },
    {
      label: "Fat",
      value: totals.fat,
      goal: goals.fatTarget,
      unit: "g",
      icon: Droplets,
      color: "#A9B8F5",
    },
  ];

  const caloriePercent = goals.calorieTarget > 0
    ? Math.min(100, (totals.calories / goals.calorieTarget) * 100)
    : 0;

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.displayName?.split(" ")[0] ?? "there"}`}
        sub={today.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      />

      {error && <ErrorBox>{error}</ErrorBox>}

      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <span className="dashboard-eyebrow">
            <Leaf size={15} /> YOUR DAILY WELLNESS
          </span>
          <h2>Eat better. Feel better.</h2>
          <p>
            Small, mindful choices add up. Track your nutrition
            and build healthier habits one meal at a time.
          </p>
          <div className="row dashboard-cta">
            <Link className="btn" to="/scanner">
              <Camera size={17} /> Scan a meal
            </Link>
            <Link className="btn secondary" to="/diary">
              View diary <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="dashboard-hero-icon">
          <div className="hero-icon-orbit orbit-one" />
          <div className="hero-icon-orbit orbit-two" />
          <Activity size={64} strokeWidth={1.2} />
        </div>
      </section>

      <div className="section-heading">
        <div>
          <h2>Today's nutrition</h2>
          <p className="small muted">
            Your progress toward your daily goals
          </p>
        </div>
        <Link className="text-link" to="/goals">
          <Target size={16} /> Goals <ArrowRight size={15} />
        </Link>
      </div>

      {loading ? (
        <div className="grid4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} />)}
        </div>
      ) : (
        <div className="grid4 dashboard-stats">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <section className="card nutrition-stat" key={card.label}>
                <div className="stat-top">
                  <span className="stat-label">{card.label}</span>
                  <span className="stat-icon" style={{ color: card.color }}>
                    <Icon size={20} />
                  </span>
                </div>
                <p className="big">
                  {Math.round(card.value * 10) / 10}
                  <span className="unit"> {card.unit}</span>
                </p>
                <ProgressBar
                  value={card.value}
                  max={card.goal}
                  label={`${card.label} progress`}
                />
                <p className="small muted stat-foot">
                  Goal: {card.goal} {card.unit}
                </p>
              </section>
            );
          })}
        </div>
      )}

      <section className="card calorie-summary">
        <div className="calorie-summary-top">
          <div>
            <span className="small muted">CALORIES CONSUMED</span>
            <p className="calorie-number">
              {Math.round(totals.calories)}
              <span> kcal</span>
            </p>
          </div>
          <div className="calorie-target">
            <span className="small muted">DAILY TARGET</span>
            <strong>{goals.calorieTarget} kcal</strong>
          </div>
        </div>

        <div
          className="calorie-track"
          role="progressbar"
          aria-label="Daily calorie target"
          aria-valuenow={Math.round(totals.calories)}
          aria-valuemin={0}
          aria-valuemax={goals.calorieTarget}
        >
          <div
            className="calorie-track-fill"
            style={{ width: `${caloriePercent}%` }}
          />
        </div>

        <div className="calorie-summary-bottom">
          <span className="small muted">
            {Math.max(0, goals.calorieTarget - totals.calories).toFixed(0)} kcal
            remaining
          </span>
          <span className="calorie-percent">
            {Math.round(
              goals.calorieTarget > 0
                ? (totals.calories / goals.calorieTarget) * 100
                : 0
            )}%
          </span>
        </div>
      </section>

      {!loading && todayMeals.length === 0 && (
        <Empty title="Your day starts with one meal">
          Add your first meal using the <Link to="/scanner">Scanner</Link> or
          the <Link to="/diary">Diary</Link>.
        </Empty>
      )}

      <div className="section-heading dashboard-chart-heading">
        <div>
          <h2>Your nutrition trends</h2>
          <p className="small muted">
            A look at the last seven days
          </p>
        </div>
        <TrendingUp size={21} />
      </div>

      <div className="grid2">
        <section className="card dashboard-chart-card">
          <div className="chart-title-row">
            <div>
              <h2>Calories this week</h2>
              <p className="small muted">Daily calorie intake</p>
            </div>
            <span className="chart-badge">7 days</span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={week}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#29372F"
                />
                <XAxis dataKey="day" stroke="#91A197" />
                <YAxis width={40} stroke="#91A197" />
                <Tooltip
                  contentStyle={{
                    background: "#17221B",
                    border: "1px solid #304637",
                    borderRadius: 12,
                    color: "#F0F5F0",
                  }}
                />
                <Bar
                  dataKey="calories"
                  name="Calories"
                  fill="#91D18B"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card dashboard-chart-card">
          <div className="chart-title-row">
            <div>
              <h2>Macro balance</h2>
              <p className="small muted">Protein, carbs and fat in grams</p>
            </div>
            <span className="chart-badge">7 days</span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={week}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#29372F"
                />
                <XAxis dataKey="day" stroke="#91A197" />
                <YAxis width={40} stroke="#91A197" />
                <Tooltip
                  contentStyle={{
                    background: "#17221B",
                    border: "1px solid #304637",
                    borderRadius: 12,
                    color: "#F0F5F0",
                  }}
                />
                
                <Line
                  type="monotone"
                  dataKey="protein"
                  name="Protein"
                  stroke="#91D18B"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="carbohydrates"
                  name="Carbs"
                  stroke="#E7BE79"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="fat"
                  name="Fat"
                  stroke="#A9B8F5"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="section-heading">
        <div>
          <h2>Keep going</h2>
          <p className="small muted">Quick ways to stay on track</p>
        </div>
      </div>

      <div className="grid2 dashboard-actions">
        <Link className="card quick-action" to="/scanner">
          <span className="quick-action-icon"><Camera size={21} /></span>
          <span className="quick-action-copy">
            <strong>Scan your next meal</strong>
            <span className="small muted">
              Capture a meal and record its nutrition
            </span>
          </span>
          <ArrowRight size={18} />
        </Link>

        <Link className="card quick-action" to="/diary">
          <span className="quick-action-icon"><Utensils size={21} /></span>
          <span className="quick-action-copy">
            <strong>Review your food diary</strong>
            <span className="small muted">
              Check what you have eaten today
            </span>
          </span>
          <ArrowRight size={18} />
        </Link>

        <Link className="card quick-action" to="/goals">
          <span className="quick-action-icon"><Target size={21} /></span>
          <span className="quick-action-copy">
            <strong>Update your goals</strong>
            <span className="small muted">
              Personalize your daily targets
            </span>
          </span>
          <ArrowRight size={18} />
        </Link>

        <Link className="card quick-action" to="/scanner">
          <span className="quick-action-icon"><Plus size={21} /></span>
          <span className="quick-action-copy">
            <strong>Log another meal</strong>
            <span className="small muted">
              Keep your nutrition history up to date
            </span>
          </span>
          <ArrowRight size={18} />
        </Link>
      </div>
    </>
  );
}
