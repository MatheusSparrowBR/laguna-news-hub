import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIAS, NEWS_STATUS, type PeriodoFiltro } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  contarFiltrosAtivos,
  filtrosIniciais,
  type NewsFilterState,
} from "@/lib/newsFilter";
import { useState } from "react";

const statusRotulos: Record<string, string> = {
  nova: "Nova",
  em_analise: "Em análise",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovada: "Aprovada",
  publicada: "Publicada",
  ignorada: "Ignorada",
  rejeitada: "Rejeitada",
  duplicada: "Duplicada",
  revisao_obrigatoria: "Revisão obrigatória",
};

const periodos: { valor: PeriodoFiltro; rotulo: string }[] = [
  { valor: "todos", rotulo: "Qualquer data" },
  { valor: "hoje", rotulo: "Hoje" },
  { valor: "24h", rotulo: "Últimas 24 horas" },
  { valor: "7dias", rotulo: "Últimos 7 dias" },
  { valor: "personalizado", rotulo: "Personalizado" },
];

export function NewsFilters({
  filtros,
  onChange,
  fontes,
}: {
  filtros: NewsFilterState;
  onChange: (filtros: NewsFilterState) => void;
  fontes: string[];
}) {
  const [aberto, setAberto] = useState(false);
  const ativos = contarFiltrosAtivos(filtros);
  const set = <K extends keyof NewsFilterState>(chave: K, valor: NewsFilterState[K]) =>
    onChange({ ...filtros, [chave]: valor });

  const campos = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Select value={filtros.status} onValueChange={(v) => set("status", v)}>
        <SelectTrigger aria-label="Status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas</SelectItem>
          {NEWS_STATUS.map((s) => (
            <SelectItem key={s} value={s}>
              {statusRotulos[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filtros.categoria} onValueChange={(v) => set("categoria", v)}>
        <SelectTrigger aria-label="Categoria">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as categorias</SelectItem>
          {CATEGORIAS.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filtros.importancia} onValueChange={(v) => set("importancia", v)}>
        <SelectTrigger aria-label="Importância">
          <SelectValue placeholder="Importância" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Toda importância</SelectItem>
          <SelectItem value="urgente">Urgente</SelectItem>
          <SelectItem value="alta">Alta</SelectItem>
          <SelectItem value="media">Média</SelectItem>
          <SelectItem value="baixa">Baixa</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filtros.fonte} onValueChange={(v) => set("fonte", v)}>
        <SelectTrigger aria-label="Fonte">
          <SelectValue placeholder="Fonte" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as fontes</SelectItem>
          {fontes.map((f) => (
            <SelectItem key={f} value={f}>
              {f}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filtros.periodo}
        onValueChange={(v) => set("periodo", v as PeriodoFiltro)}
      >
        <SelectTrigger aria-label="Data">
          <SelectValue placeholder="Data" />
        </SelectTrigger>
        <SelectContent>
          {periodos.map((p) => (
            <SelectItem key={p.valor} value={p.valor}>
              {p.rotulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtros.periodo === "personalizado" && (
        <>
          <Input
            type="date"
            aria-label="Data inicial"
            value={filtros.dataInicio}
            onChange={(e) => set("dataInicio", e.target.value)}
          />
          <Input
            type="date"
            aria-label="Data final"
            value={filtros.dataFim}
            onChange={(e) => set("dataFim", e.target.value)}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtros.busca}
            onChange={(e) => set("busca", e.target.value)}
            placeholder="Pesquisar notícias..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Collapsible open={aberto} onOpenChange={setAberto} className="lg:hidden">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="size-4" />
                Filtros{ativos > 0 ? ` (${ativos})` : ""}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          {ativos > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ...filtrosIniciais, busca: filtros.busca })}
            >
              <X className="size-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Desktop: filtros sempre visíveis */}
      <div className="mt-4 hidden lg:block">{campos}</div>

      {/* Mobile: painel recolhível */}
      <Collapsible open={aberto} onOpenChange={setAberto} className="lg:hidden">
        <CollapsibleContent className="mt-4">{campos}</CollapsibleContent>
      </Collapsible>

      {ativos > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {filtros.status !== "todos" && (
            <StatusBadge tipo="noticia" valor={filtros.status as never} />
          )}
          {filtros.categoria !== "todas" && (
            <span className="text-xs text-muted-foreground">
              Categoria: {filtros.categoria}
            </span>
          )}
          {filtros.fonte !== "todas" && (
            <span className="text-xs text-muted-foreground">Fonte: {filtros.fonte}</span>
          )}
        </div>
      )}
    </div>
  );
}
