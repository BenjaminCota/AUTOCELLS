import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ title, children, onClose }) {
  const titleId = useId();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Con el modal abierto, la página de fondo no debe scrollear (si el contenido
  // del modal es alto, el scroll ocurre dentro del propio panel).
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Portal a <body>: un ancestro con transform o backdrop-filter (el <header>
  // usa backdrop-blur; <main> queda con transform tras la animación de página)
  // se vuelve el containing block de position:fixed y el modal se centraría
  // contra ese ancestro en vez del viewport.
  return createPortal(
    // z-[80]: por encima del drawer del carrito (z-70) y debajo de los toasts (z-90).
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-card bg-white p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-bold text-secondary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-secondary/60 transition-colors hover:text-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
