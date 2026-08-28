import {
  BarChart3,
  Instagram,
  LayoutDashboard,
  Newspaper,
  Rss,
  Send,
  Settings,
  ListChecks,
} from "lucide-react";

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icone: LayoutDashboard },
  { to: "/news", label: "Notícias", icone: Newspaper },
  { to: "/feed", label: "Feed", icone: ListChecks },
  { to: "/publications", label: "Publicações", icone: Send },
  { to: "/sources", label: "Fontes", icone: Rss },
  { to: "/instagram", label: "Instagram", icone: Instagram },
  { to: "/analytics", label: "Analytics", icone: BarChart3 },
  { to: "/settings", label: "Configurações", icone: Settings },
] as const;
