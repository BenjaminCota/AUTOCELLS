import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Info, TriangleAlert, X } from 'lucide-react';

// Toasts: retroalimentación no bloqueante para acciones puntuales (agregar al
// carrito, guardar, eliminar...). Para decisiones que requieren respuesta del
// usuario usar ConfirmDialog, no un toast.
const ToastContext = createContext(null);

const TOAST_DURATION_MS = 3500;
const MAX_VISIBLE = 4;

const variantConfig = {
  success: { icon: CheckCircle2, accent: 'border-l-success-dark', iconColor: 'text-success-dark' },
  error: { icon: XCircle, accent: 'border-l-danger-dark', iconColor: 'text-danger-dark' },
  warning: { icon: TriangleAlert, accent: 'border-l-secondary', iconColor: 'text-secondary' },
  info: { icon: Info, accent: 'border-l-primary-dark', iconColor: 'text-primary-dark' },
};

let nextToastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (variant, message) => {
      const id = ++nextToastId;
      // Se limita la pila para que acciones repetidas no tapen la pantalla.
      setToasts((current) => [...current, { id, variant, message }].slice(-MAX_VISIBLE));
      setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      warning: (message) => push('warning', message),
      info: (message) => push('info', message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Sobre el drawer del carrito (z-70) y los modales (z-50). */}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map(({ id, variant, message }) => {
          const { icon: Icon, accent, iconColor } = variantConfig[variant] ?? variantConfig.info;
          return (
            <div
              key={id}
              className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-card border border-secondary/10 border-l-4 bg-white p-4 shadow-lg ${accent}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
              <p className="flex-1 text-sm text-secondary">{message}</p>
              <button
                type="button"
                aria-label="Cerrar notificación"
                onClick={() => dismiss(id)}
                className="shrink-0 text-secondary/40 transition-colors hover:text-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return context;
}
