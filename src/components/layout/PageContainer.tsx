import { Header } from "./Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageContainerProps {
  titulo: string;
  descricao?: string;
  acoes?: React.ReactNode;
  children: React.ReactNode;
}

export function PageContainer({ titulo, descricao, acoes, children }: PageContainerProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header titulo={titulo} descricao={descricao} acoes={acoes} />
      <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

interface SectionCardProps {
  titulo: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionCard({ titulo, acao, children }: SectionCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{titulo}</CardTitle>
        {acao}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
