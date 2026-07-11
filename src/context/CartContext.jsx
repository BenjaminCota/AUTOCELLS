import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { products } from '../data/products';

// Carrito 100% frontend (aún no hay backend): se guarda en localStorage para
// sobrevivir recargas. Cuando exista la base de datos, este contexto es el
// único lugar que hay que conectar al API (src/lib/api.js).
const STORAGE_KEY = 'autocells:cart';

const CartContext = createContext(null);

// Un renglón del carrito = producto + variante elegida (almacenamiento/color).
export function lineKey({ id, storage, color }) {
  return [id, storage ?? '', color ?? ''].join('|');
}

function readStoredItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Descarta renglones de productos que ya no existen en el catálogo.
    return parsed.filter((item) => item?.qty > 0 && products.some((p) => p.id === item.id));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredItems);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sin localStorage (modo incógnito estricto) el carrito solo vive en memoria.
    }
  }, [items]);

  const value = useMemo(() => {
    const detailed = items.map((item) => {
      const product = products.find((p) => p.id === item.id);
      return { ...item, key: lineKey(item), product, subtotal: product.price * item.qty };
    });
    const total = detailed.reduce((sum, line) => sum + line.subtotal, 0);
    const count = detailed.reduce((sum, line) => sum + line.qty, 0);

    function addItem(product, { storage, color } = {}) {
      const entry = { id: product.id, storage, color };
      const key = lineKey(entry);
      setItems((current) => {
        const existing = current.find((item) => lineKey(item) === key);
        if (existing) {
          return current.map((item) =>
            lineKey(item) === key ? { ...item, qty: Math.min(item.qty + 1, 99) } : item,
          );
        }
        return [...current, { ...entry, qty: 1 }];
      });
      setIsOpen(true);
    }

    function setQty(key, qty) {
      setItems((current) =>
        qty < 1
          ? current.filter((item) => lineKey(item) !== key)
          : current.map((item) => (lineKey(item) === key ? { ...item, qty: Math.min(qty, 99) } : item)),
      );
    }

    function removeItem(key) {
      setItems((current) => current.filter((item) => lineKey(item) !== key));
    }

    return {
      items: detailed,
      total,
      count,
      isOpen,
      addItem,
      setQty,
      removeItem,
      clearCart: () => setItems([]),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    };
  }, [items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return context;
}
