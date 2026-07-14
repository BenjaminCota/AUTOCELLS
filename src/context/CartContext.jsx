import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useCatalog } from '../data/products';

// El carrito vive 100% en el frontend (localStorage) para sobrevivir recargas;
// solo el pedido final se manda al API. Los renglones guardan la forma cruda
// {id, storage, color, qty} y se enriquecen contra el catálogo al renderizar.
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
    // Aquí solo se valida la forma: el catálogo (incluye productos del admin)
    // llega async del API, así que borrar renglones "desconocidos" en este punto
    // perdería líneas válidas. Se ocultan al renderizar (ver `detailed`).
    return parsed.filter((item) => item?.qty > 0);
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { products } = useCatalog();
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
    // Renglones cuyo producto no está en el catálogo (fue eliminado, o el API
    // aún no responde) se ocultan del render sin borrarse del storage.
    const detailed = items.flatMap((item) => {
      const product = products.find((p) => p.id === item.id);
      if (!product) return [];
      return [{ ...item, key: lineKey(item), product, subtotal: product.price * item.qty }];
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
  }, [items, isOpen, products]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return context;
}
