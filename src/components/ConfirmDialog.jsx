import Modal from './Modal';

// Confirmación bloqueante para acciones importantes o destructivas (cerrar
// sesión, vaciar carrito, eliminar registros, cancelar pedidos). Para avisos
// que no requieren decisión usar un toast (useToast), no este diálogo.
export default function ConfirmDialog({
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="text-secondary">{children}</div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-card border border-secondary/20 px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:border-secondary/40"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-card px-4 py-2 text-sm font-semibold text-white transition-colors ${
            danger ? 'bg-danger-dark hover:bg-danger-dark/90' : 'bg-primary-dark hover:bg-primary-hover'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
