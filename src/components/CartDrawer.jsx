import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, Minus, Plus, Trash2, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { categoryIcons, priceFormatter } from './ProductCard';
import { whatsappLink } from '../data/store';

// Panel deslizante desde la derecha. Siempre está montado: abrir/cerrar solo
// alterna clases, así la transición de salida también se ve (translate-x-full).
export default function CartDrawer() {
  const { items, total, count, isOpen, setQty, removeItem, clearCart, closeCart } = useCart();
  const panelRef = useRef(null);

  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!isOpen) return undefined;
    function onKeyDown(event) {
      if (event.key === 'Escape') closeCart();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  const orderMessage = [
    'Hola, quiero hacer este pedido:',
    ...items.map((line) => {
      const variant = [line.storage, line.color].filter(Boolean).join(', ');
      return `• ${line.qty}× ${line.product.name}${variant ? ` (${variant})` : ''} — ${priceFormatter.format(line.subtotal)}`;
    }),
    `Total: ${priceFormatter.format(total)}`,
  ].join('\n');

  return (
    <>
      {/* Fondo oscurecido */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={`fixed inset-0 z-[60] bg-secondary/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl outline-none transition-transform duration-[420ms] ease-snappy ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-secondary/10 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wide text-secondary">
            <ShoppingCart className="h-5 w-5 text-primary-dark" />
            Tu carrito
            {count > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary-dark">
                {count}
              </span>
            )}
          </h2>
          <button
            type="button"
            aria-label="Cerrar carrito"
            onClick={closeCart}
            className="rounded-card p-1.5 text-secondary transition-colors hover:bg-bg-alt hover:text-primary-dark"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ShoppingCart className="h-8 w-8 text-primary-dark" strokeWidth={1.5} />
            </span>
            <div>
              <p className="font-bold uppercase tracking-wide text-secondary">Tu carrito está vacío</p>
              <p className="mt-1 text-sm text-muted">Agrega productos desde el catálogo.</p>
            </div>
            <Link
              to="/catalogo"
              onClick={closeCart}
              className="rounded-card bg-primary-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-secondary/10 overflow-y-auto px-5">
              {items.map((line) => {
                const Icon = categoryIcons[line.product.category] ?? ShoppingCart;
                const variant = [line.storage, line.color].filter(Boolean).join(' · ');
                return (
                  <li key={line.key} className="flex gap-3 py-4">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-card bg-bg-alt">
                      <Icon className="h-7 w-7 text-secondary/30" strokeWidth={1.25} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="truncate text-sm font-semibold text-secondary">{line.product.name}</p>
                      {variant && <p className="text-xs text-muted">{variant}</p>}
                      <div className="mt-1 flex items-center justify-between">
                        <div className="flex items-center rounded-card border border-secondary/20">
                          <button
                            type="button"
                            aria-label="Quitar uno"
                            onClick={() => setQty(line.key, line.qty - 1)}
                            className="p-1.5 text-secondary transition-colors hover:text-primary-dark"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-7 text-center text-sm font-semibold text-secondary">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            aria-label="Agregar uno"
                            onClick={() => setQty(line.key, line.qty + 1)}
                            className="p-1.5 text-secondary transition-colors hover:text-primary-dark"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-secondary">
                          {priceFormatter.format(line.subtotal)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Quitar ${line.product.name}`}
                      onClick={() => removeItem(line.key)}
                      className="self-start p-1 text-secondary/50 transition-colors hover:text-danger-dark"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>

            <footer className="border-t border-secondary/10 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide text-muted">Total</span>
                <span className="text-xl font-bold text-secondary">{priceFormatter.format(total)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                El pedido se coordina por WhatsApp: pago y entrega en tienda.
              </p>
              <a
                href={whatsappLink(orderMessage)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                <MessageCircle className="h-5 w-5" />
                Pedir por WhatsApp
              </a>
              <button
                type="button"
                onClick={clearCart}
                className="mt-2 w-full rounded-card px-5 py-2 text-xs font-semibold text-muted transition-colors hover:text-danger-dark"
              >
                Vaciar carrito
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
