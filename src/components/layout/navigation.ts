import {
  BarChart3,
  CalendarDays,
  Handshake,
  Instagram,
  LayoutDashboard,
  MapPin,
  Newspaper,
  Rss,
  Send,
  Settings,
  ClipboardCheck,
  Images,
  ListChecks,
  Megaphone,
  PackageCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icone: LucideIcon;
}

export interface NavGroup {
  /** `null` = itens sem cabeçalho de grupo. */
  titulo: string | null;
  itens: readonly NavItem[];
}

export const navGroups: readonly NavGroup[] = [
  {
    titulo: null,
    itens: [{ to: "/dashboard", label: "Dashboard", icone: LayoutDashboard }],
  },
  {
    titulo: "Conteúdo",
    itens: [
      { to: "/news", label: "Notícias", icone: Newspaper },
      { to: "/editorial", label: "Editorial", icone: ClipboardCheck },
      { to: "/editorial/geografia", label: "Revisão geográfica", icone: MapPin },
      { to: "/feed", label: "Feed", icone: ListChecks },
    ],
  },
  {
    titulo: "Publicação",
    itens: [
      { to: "/posts", label: "Posts e artes", icone: Images },
      { to: "/calendar", label: "Calendário", icone: CalendarDays },
      { to: "/publishing", label: "Fila", icone: Send },
      { to: "/publications", label: "Publicações", icone: Send },
    ],
  },
  {
    titulo: "Monetização",
    itens: [
      { to: "/sponsors", label: "Patrocinadores", icone: Handshake },
      { to: "/sponsors/campaigns", label: "Campanhas", icone: Megaphone },
      { to: "/sponsors/deliverables", label: "Entregas", icone: PackageCheck },
    ],
  },
  {
    titulo: null,
    itens: [{ to: "/analytics", label: "Analytics", icone: BarChart3 }],
  },
  {
    titulo: "Integrações",
    itens: [{ to: "/instagram", label: "Instagram", icone: Instagram }],
  },
  {
    titulo: "Configurações",
    itens: [
      { to: "/sources", label: "Fontes", icone: Rss },
      { to: "/settings", label: "Sistema", icone: Settings },
    ],
  },
] as const;

/** Lista achatada — mantida para usos que precisam de todos os itens. */
export const navItems: readonly NavItem[] = navGroups.flatMap((g) => g.itens);
