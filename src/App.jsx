import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { CartProvider } from './context/CartContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import SplashScreen from './components/SplashScreen';

import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/Orders';
import AdminServices from './pages/admin/Services';

export default function App() {
  // El splash cubre la app solo en la carga inicial; el contenido ya está
  // montado debajo, así que al desvanecerse no hay salto de layout.
  const [splashDone, setSplashDone] = useState(false);

  return (
    // basename sigue al `base` de vite.config.js (/benjamin_cota/), así las rutas
    // del router funcionan igual en dev y en el servidor de la escuela.
    // CartProvider no usa hooks del router, por eso puede envolverlo.
    <CartProvider>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="catalogo" element={<Catalog />} />
          <Route path="catalogo/:category/:productId" element={<ProductDetail />} />
          <Route path="servicios" element={<Services />} />
          <Route path="contacto" element={<Contact />} />
          <Route path="login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="productos" element={<AdminProducts />} />
            <Route path="productos/nuevo" element={<AdminProductForm />} />
            <Route path="productos/:productId/editar" element={<AdminProductForm />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="servicios" element={<AdminServices />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    </CartProvider>
  );
}
