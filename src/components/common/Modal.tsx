import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}

export function Modal({ aberto, onOpenChange, titulo, descricao, children }: ModalProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {descricao && <DialogDescription>{descricao}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
