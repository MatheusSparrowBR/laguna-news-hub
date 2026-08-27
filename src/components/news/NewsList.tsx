import { NewsCard } from "@/components/common/NewsCard";
import type { NewsItem } from "@/lib/types";
import type { NewsActionHandlers } from "./NewsActions";

interface NewsListProps {
  noticias: NewsItem[];
  handlers: NewsActionHandlers;
}

export function NewsList({ noticias }: NewsListProps) {
  return (
    <div className="space-y-2">
      {noticias.map((n) => (
        <NewsCard key={n.id} noticia={n} />
      ))}
    </div>
  );
}
