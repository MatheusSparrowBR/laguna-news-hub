import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import type { DailyMetric } from "@/lib/types";

export function PublicationsChart({ dados }: { dados: DailyMetric[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={dados}>
        <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="publicacoes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ReachChart({ dados }: { dados: DailyMetric[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={dados}>
        <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="alcance"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary) / 0.15)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
