import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Weight,
  Droplets,
  Dumbbell,
  Flame,
  Activity,
  Zap,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import { useEffect, useRef, useState } from "react";
import "./index.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const defaultData = [
  { date: "Mar 10", weight: 120.4, water: 55.2, muscle: 96.4, bodyFat: 12.6 },
  { date: "Mar 17", weight: 119.8, water: 55.8, muscle: 96.1, bodyFat: 12.4 },
  { date: "Mar 24", weight: 120.9, water: 56.3, muscle: 96.9, bodyFat: 12.2 },
  { date: "Mar 31", weight: 118.7, water: 55.6, muscle: 95.8, bodyFat: 12.8 },
  { date: "Apr 07", weight: 120.0, water: 56.1, muscle: 96.7, bodyFat: 12.3 },
  { date: "Apr 12", weight: 118.8, water: 56.0, muscle: 95.9, bodyFat: 12.5 },
];

function metricChange(current, previous) {
  if (previous === undefined || previous === null) return null;
  return (current - previous).toFixed(1);
}

function MetricCard({ title, value, unit, change, subtitle, icon, decimals = 1 }) {
  const positive = change !== null ? Number(change) >= 0 : null;

  return (
    <div className="card">
      <div className="card-top">
        <h3>{title}</h3>
        <div className="icon-box">{icon}</div>
      </div>

      <div className="metric-value">
        <AnimatedNumber
          value={Number(value)}
          decimals={Number(value) % 1 !== 0 ? 1 : 0}
        />
        <span>{unit}</span>
      </div>

      <div className="card-bottom">
        <span className="subtitle">{subtitle}</span>
        {change !== null && (
          <div className={`change-badge ${positive ? "up" : "down"}`}>
            {positive ? "+" : ""}
            <AnimatedNumber value={Math.abs(Number(change))} decimals={1} duration={700} />
          </div>
        )}
      </div>
    </div>
  );
}

function AnimatedNumber({ value, decimals = 1, duration = 900 }) {
  const [displayValue, setDisplayValue] = useState(value);
  const startRef = useRef(null);
  const startValueRef = useRef(value);

  useEffect(() => {
    startRef.current = null;
    const initialValue = displayValue;
    startValueRef.current = initialValue;

    let animationFrame;

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;

      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const nextValue =
        startValueRef.current + (value - startValueRef.current) * easedProgress;

      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{displayValue.toFixed(decimals)}</>;
}

export default function App() {
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem("progressEntries");
    return saved ? JSON.parse(saved) : defaultData;
  });

  const [form, setForm] = useState({
    date: "",
    weight: "",
    water: "",
    muscle: "",
    bodyFat: "",
  });

  const [selectedMetric, setSelectedMetric] = useState("weight");

  useEffect(() => {
    localStorage.setItem("progressEntries", JSON.stringify(entries));
  }, [entries]);

  const latest = entries[entries.length - 1];
  const previous = entries[entries.length - 2];

  const bmi = (latest.weight / (1.575 * 1.575)).toFixed(1);
  const bmr = Math.round(
    10 * (latest.weight * 0.453592) + 6.25 * 157.5 - 5 * 23 + 5
  );

  const metricConfig = {
    weight: {
      label: "Weight",
      unit: "lbs",
      color: "#ef4444",
    },
    water: {
      label: "Water %",
      unit: "%",
      color: "#3b82f6",
    },
    muscle: {
      label: "Muscle Mass",
      unit: "lbs",
      color: "#22c55e",
    },
    bodyFat: {
      label: "Body Fat %",
      unit: "%",
      color: "#f97316",
    },
  };

  const currentMetric = metricConfig[selectedMetric];

  const chartData = {
    labels: entries.map((entry) => entry.date),
    datasets: [
      {
        label: `${currentMetric.label} (${currentMetric.unit})`,
        data: entries.map((entry) => entry[selectedMetric]),
        borderColor: currentMetric.color,
        backgroundColor: `${currentMetric.color}33`,
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: currentMetric.color,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 1.5,
        borderWidth: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: {
        labels: {
          color: "#ffffff",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#a1a1aa",
        },
        grid: {
          color: "rgba(255,255,255,0.08)",
        },
      },
      y: {
        ticks: {
          color: "#a1a1aa",
        },
        grid: {
          color: "rgba(255,255,255,0.08)",
        },
      },
    },
  };

  const addEntry = () => {
    if (!form.date || !form.weight || !form.water || !form.muscle || !form.bodyFat) {
      return;
    }

    const formattedDate = new Date(form.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const nextEntry = {
      date: formattedDate,
      weight: Number(form.weight),
      water: Number(form.water),
      muscle: Number(form.muscle),
      bodyFat: Number(form.bodyFat),
    };

    setEntries([...entries, nextEntry]);
    setForm({
      date: "",
      weight: "",
      water: "",
      muscle: "",
      bodyFat: "",
    });
  };

  const deleteEntry = (indexToDelete) => {
    const updatedEntries = entries.filter((_, index) => index !== indexToDelete);
    setEntries(updatedEntries);
  };

  const resetEntries = () => {
    setEntries(defaultData);
    localStorage.removeItem("progressEntries");
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="hero">
          <div>
            <p className="eyebrow">Personal Dashboard</p>
            <h1>Progress Tracking Dashboard</h1>
            <p className="hero-text">
              Track weight, hydration, muscle mass, and body fat in one clean dashboard.
            </p>
          </div>

          <div className="latest-box">
            <div className="latest-label">Latest Check-In</div>
            <div className="latest-date">{latest.date}</div>
          </div>
        </div>

        <section className="metric-grid">
          <MetricCard
            title="Current Weight"
            value={latest.weight.toFixed(1)}
            unit="lbs"
            change={metricChange(latest.weight, previous?.weight)}
            subtitle="Latest weigh-in"
            icon={<Weight size={18} />}
            decimals={1}
          />
          <MetricCard
            title="Water %"
            value={latest.water.toFixed(1)}
            unit="%"
            change={metricChange(latest.water, previous?.water)}
            subtitle="Hydration estimate"
            icon={<Droplets size={18} />}
            decimals={1}
          />
          <MetricCard
            title="Muscle Mass"
            value={latest.muscle.toFixed(1)}
            unit="lbs"
            change={metricChange(latest.muscle, previous?.muscle)}
            subtitle="Tracked from scale"
            icon={<Dumbbell size={18} />}
            decimals={1}
          />
          <MetricCard
            title="Body Fat"
            value={latest.bodyFat.toFixed(1)}
            unit="%"
            change={metricChange(latest.bodyFat, previous?.bodyFat)}
            subtitle="Composition trend"
            icon={<Flame size={18} />}
            decimals={1}
          />
          <MetricCard
            title="BMI"
            value={bmi}
            unit=""
            change={null}
            subtitle="Estimated from height"
            icon={<Activity size={18} />}
            decimals={1}
          />
          <MetricCard
            title="BMR"
            value={bmr}
            unit="kcal"
            change={null}
            subtitle="Estimated calories at rest"
            icon={<Zap size={18} />}
            decimals={0}
          />
        </section>

        <section className="main-grid">
          

          <div className="panel">
            <div className="panel-header">

              <div className="panel">
                <div className="panel-header">
                  <h2>{currentMetric.label} Trend</h2>
                  <p>Track your {currentMetric.label.toLowerCase()} changes over time.</p>
                </div>

                <div className="chart-toggle">
                  <button
                    className={selectedMetric === "weight" ? "toggle-btn active" : "toggle-btn"}
                    onClick={() => setSelectedMetric("weight")}
                  >
                    Weight
                  </button>
                  <button
                    className={selectedMetric === "water" ? "toggle-btn active" : "toggle-btn"}
                    onClick={() => setSelectedMetric("water")}
                  >
                    Water %
                  </button>
                  <button
                    className={selectedMetric === "muscle" ? "toggle-btn active" : "toggle-btn"}
                    onClick={() => setSelectedMetric("muscle")}
                  >
                    Muscle Mass
                  </button>
                  <button
                    className={selectedMetric === "bodyFat" ? "toggle-btn active" : "toggle-btn"}
                    onClick={() => setSelectedMetric("bodyFat")}
                  >
                    Body Fat %
                  </button>
                </div>

                <div className="chart-box">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>

              <h2>Recent Entries</h2>
            </div>

            <div className="entry-list">
              {entries
                .slice()
                .reverse()
                .map((entry, index) => {
                  const originalIndex = entries.length - 1 - index;

                  return (
                    <div className="entry-row" key={`${entry.date}-${index}`}>
                      <span>{entry.date}</span>
                      <span>{entry.weight} lbs</span>
                      <span>{entry.water}% water</span>
                      <span>{entry.muscle} lbs muscle</span>
                      <span>{entry.bodyFat}% body fat</span>
                      <button
                        className="delete-btn"
                        onClick={() => deleteEntry(originalIndex)}
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Add New Entry</h2>
              <p>Log a new progress check-in.</p>
            </div>

            <div className="form-grid">
              <div>
                <label>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              <div>
                <label>Weight (lbs)</label>
                <input
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  placeholder="119.4"
                />
              </div>

              <div>
                <label>Water %</label>
                <input
                  value={form.water}
                  onChange={(e) => setForm({ ...form, water: e.target.value })}
                  placeholder="56.5"
                />
              </div>

              <div>
                <label>Muscle Mass (lbs)</label>
                <input
                  value={form.muscle}
                  onChange={(e) => setForm({ ...form, muscle: e.target.value })}
                  placeholder="96.3"
                />
              </div>

              <div>
                <label>Body Fat %</label>
                <input
                  value={form.bodyFat}
                  onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
                  placeholder="12.1"
                />
              </div>

              <button className="primary-btn" onClick={addEntry}>
                Add Progress Entry
              </button>

              <button
                className="secondary-btn"
                type="button"
                onClick={resetEntries}
              >
                Reset Sample Data
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}