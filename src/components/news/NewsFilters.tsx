import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIAS, IMPORTANCIAS, NEWS_STATUS } from "@/lib/types";
import type { FiltrosNoticia } from "@/lib/newsFilter";

interface NewsFiltersProps {
  filtros: FiltrosNoticia;
  onChange: (filtros: FiltrosNoticia) => void;
  fontes: string[];
}

export function NewsFilters({ filtros, onChange, fontes }: NewsFiltersProps) {
  const atualizar = (parcial: Partial<FiltrosNoticia>) =>
    onChange({ ...filtros, ...parcial });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar notícia..."
          value={filtros.busca}
          onChange={(e) => atualizar({ busca: e.target.value })}
          className="pl-9"
        />
      </div>

      <Select
        value={filtros.status || "_todos"}
        onValueChange={(v) => atualizar({ status: v === "_todos" ? undefined : v })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_todos">Todos os status</SelectItem>
          {NEWS_STATUS.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filtros.categoria || "_todas"}
        onValueChange={(v) => atualizar({ categoria: v === "_todas" ? undefined : v })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_todas">Todas</SelectItem>
          {CATEGORIAS.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filtros.importancia || "_todas"}
        onValueChange={(v) => atualizar({ importancia: v === "_todas" ? undefined : v })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Importância" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_todas">Todas</SelectItem>
          {IMPORTANCIAS.map((i) => (
            <SelectItem key={i} value={i}>
              {i}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filtros.fonte || "_todas"}
        onValueChange={(v) => atualizar({ fonte: v === "_todas" ? undefined : v })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Fonte" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_todas">Todas as fontes</SelectItem>
          {fontes.map((f) => (
            <SelectItem key={f} value={f}>
              {f}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
