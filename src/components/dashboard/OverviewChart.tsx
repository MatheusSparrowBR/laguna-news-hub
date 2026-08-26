import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyMetric } from "@/lib/types";

const eixo = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
};

export function PublicationsChart({ dados }: { dados: DailyMetric[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="dia" tickLine={false} axisLine={false} {...eixo} />
          <YAxis tickLine={false} axisLine={false} {...eixo} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="publicacoes"
            name="Publicações"
            fill="var(--chart-1)"
            radius={[6, 6, 0, 0]}
            maxBarSize={38}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReachChart({ dados }: { dados: DailyMetric[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="dia" tickLine={false} axisLine={false} {...eixo} />
          <YAxis tickLine={false} axisLine={false} {...eixo} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="alcance"
            name="Alcance"
            stroke="var(--chart-2)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
