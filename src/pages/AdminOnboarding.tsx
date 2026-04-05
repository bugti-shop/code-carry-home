import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Users, Globe, Target, Smartphone, RefreshCw, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(160, 55%, 45%)",
  "hsl(45, 80%, 55%)",
  "hsl(280, 55%, 55%)",
  "hsl(20, 70%, 55%)",
];

type OnboardingRow = {
  id: string;
  language: string | null;
  goals: string[] | null;
  source: string | null;
  previous_app: string | null;
  frustration: string | null;
  task_view_preference: string | null;
  journey_selected: string | null;
  devices: string[] | null;
  offline_preference: string | null;
  unfinished_reason: string | null;
  slowdown_reason: string | null;
  why_apps_fail: string | null;
  note_created: boolean | null;
  sketch_created: boolean | null;
  tasks_created_count: number | null;
  notes_folders_count: number | null;
  tasks_folders_count: number | null;
  created_at: string;
};

function countField(rows: OnboardingRow[], field: keyof OnboardingRow): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  rows.forEach(r => {
    const val = r[field];
    if (val && typeof val === "string") {
      counts[val] = (counts[val] || 0) + 1;
    }
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function countArrayField(rows: OnboardingRow[], field: "goals" | "devices"): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  rows.forEach(r => {
    const arr = r[field];
    if (Array.isArray(arr)) {
      arr.forEach((item: string) => {
        if (item) counts[item] = (counts[item] || 0) + 1;
      });
    }
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

const ChartCard = ({ title, icon: Icon, data, type = "bar" }: {
  title: string;
  icon: React.ElementType;
  data: { name: string; value: number }[];
  type?: "bar" | "pie";
}) => {
  if (!data.length) return null;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {type === "pie" ? (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} fontSize={11} />
              <YAxis type="category" dataKey="name" width={120} fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

const ADMIN_PASSWORD = "flowist2024admin";

export default function AdminOnboarding() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<OnboardingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem("admin_auth") === "true");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "true");
      setAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("onboarding_responses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    setRows((data as OnboardingRow[] | null) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => ({
    languages: countField(rows, "language"),
    goals: countArrayField(rows, "goals"),
    sources: countField(rows, "source"),
    previousApps: countField(rows, "previous_app"),
    frustrations: countField(rows, "frustration"),
    viewPrefs: countField(rows, "task_view_preference"),
    journeys: countField(rows, "journey_selected"),
    devices: countArrayField(rows, "devices"),
    offlinePrefs: countField(rows, "offline_preference"),
    unfinishedReasons: countField(rows, "unfinished_reason"),
    slowdownReasons: countField(rows, "slowdown_reason"),
    whyAppsFail: countField(rows, "why_apps_fail"),
  }), [rows]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-8">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1">Onboarding Analytics</h1>
        <Button variant="ghost" size="icon" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-4 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Users className="w-6 h-6 mx-auto text-primary mb-1" />
              <div className="text-2xl font-bold">{rows.length}</div>
              <div className="text-xs text-muted-foreground">Total Responses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Globe className="w-6 h-6 mx-auto text-primary mb-1" />
              <div className="text-2xl font-bold">{stats.languages.length}</div>
              <div className="text-xs text-muted-foreground">Languages</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <ChartCard title="Languages" icon={Globe} data={stats.languages} type="pie" />
        <ChartCard title="Goals Selected" icon={Target} data={stats.goals} />
        <ChartCard title="How Users Found Us" icon={Users} data={stats.sources} />
        <ChartCard title="Previous Apps Used" icon={Smartphone} data={stats.previousApps} />
        <ChartCard title="Frustrations" icon={Target} data={stats.frustrations} />
        <ChartCard title="Task View Preference" icon={Target} data={stats.viewPrefs} type="pie" />
        <ChartCard title="Journey Selected" icon={Target} data={stats.journeys} type="pie" />
        <ChartCard title="Devices" icon={Smartphone} data={stats.devices} />
        <ChartCard title="Offline Preference" icon={Target} data={stats.offlinePrefs} type="pie" />
        <ChartCard title="Why Tasks Stay Unfinished" icon={Target} data={stats.unfinishedReasons} />
        <ChartCard title="What Slows Users Down" icon={Target} data={stats.slowdownReasons} />
        <ChartCard title="Why Apps Fail" icon={Target} data={stats.whyAppsFail} />
      </div>
    </div>
  );
}
