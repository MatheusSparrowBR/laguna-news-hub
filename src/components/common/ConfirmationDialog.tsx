import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmationDialogProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo: string;
  descricao: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  onConfirmar: () => void;
}

export function ConfirmationDialog({
  aberto,
  onOpenChange,
  titulo,
  descricao,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  onConfirmar,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={aberto} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{textoCancelar}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmar}>{textoConfirmar}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
