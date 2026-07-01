"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { api, ChartPoint } from "@/lib/api";

const RANGES = [
  { label: "1 savaitė", days: 7 },
  { label: "1 mėnuo", days: 30 },
  { label: "Ketvirtis", days: 90 },
  { label: "Metai", days: 365 },
  { label: "Visas laikas", days: 0 },
];

function AdminChart({
  title,
  description,
  data,
  color,
}: {
  title: string;
  description: string;
  data: ChartPoint[];
  color: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <p className="text-sm font-semibold text-white mb-1">{title}</p>
      <p className="text-xs text-zinc-500 mb-6">{description}</p>
      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-xs text-zinc-600">
          Duomenų dar nėra
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickFormatter={(v) => v.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 8,
                fontSize: 12,
                color: "#fff",
              }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(value) => [value, "Kiekis"]}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [submissions, setSubmissions] = useState<ChartPoint[]>([]);
  const [userGrowth, setUserGrowth] = useState<ChartPoint[]>([]);
  const [activeUsers, setActiveUsers] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.adminAnalyticsSubmissions(days),
      api.adminAnalyticsUserGrowth(days),
      api.adminAnalyticsActiveUsers(days),
    ])
      .then(([s, u, a]) => {
        setSubmissions(s);
        setUserGrowth(u);
        setActiveUsers(a);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  if (error) return <div className="p-8 text-sm text-red-400">{error}</div>;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-1">Analitika</h1>
        <p className="text-sm text-zinc-400">Sistemos veiklos apžvalga.</p>
      </div>

      {/* Time range selector */}
      <div className="flex gap-1 mb-8 bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-fit">
        {RANGES.map((r) => (
          <button
            key={r.days}
            onClick={() => setDays(r.days)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              days === r.days ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-zinc-500">Kraunama…</div>
      ) : (
        <div className="flex flex-col gap-6">
          <AdminChart
            title="Pateiktos sutartys"
            description="Sutarčių pateikimai per dieną"
            data={submissions}
            color="#34d399"
          />
          <AdminChart
            title="Naujų vartotojų augimas"
            description="Naujai užsiregistravę vartotojai per dieną"
            data={userGrowth}
            color="#818cf8"
          />
          <AdminChart
            title="Aktyvūs vartotojai"
            description="Vartotojai, kurie prisijungė per dieną"
            data={activeUsers}
            color="#38bdf8"
          />
        </div>
      )}
    </div>
  );
}
