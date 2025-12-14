import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ShoppingCart, PackagePlus, Banknote, Globe } from 'lucide-react';
import { JOBUZETTI_LOGO_URL } from '../assets';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => 
    location.pathname === path ? "bg-jobu-red text-white shadow-lg" : "text-slate-300 hover:bg-white/10 hover:text-white";

  return (
    <nav className="w-64 bg-jobu-blue min-h-screen flex flex-col fixed left-0 top-0 z-50 shadow-xl">
      <div className="p-6 mb-6 flex flex-col items-center justify-center border-b border-white/10">
        <img 
            src={JOBUZETTI_LOGO_URL} 
            alt="Jobuzetti S.A." 
            className="w-full max-w-[180px] h-auto object-contain filter drop-shadow-md bg-white/90 p-2 rounded-lg"
            onError={(e) => {
                // Fallback si la imagen falla
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML += '<span class="text-white font-bold text-xl">JOBUZETTI</span>';
            }}
        />
        <p className="text-xs text-slate-300 mt-3 uppercase tracking-wider font-medium text-center">
            Gestión de Autopartes
        </p>
      </div>

      <div className="flex-1 px-4 space-y-2">
        <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/')}`}>
          <LayoutDashboard size={20} />
          Inventario
        </Link>

        <Link to="/ingreso" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/ingreso')}`}>
          <PlusCircle size={20} />
          Ingreso Stock
        </Link>

        <Link to="/nuevo-producto" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/nuevo-producto')}`}>
          <PackagePlus size={20} />
          Nuevo Producto
        </Link>

        <Link to="/pedidos" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/pedidos')}`}>
          <ShoppingCart size={20} />
          Pedidos / Remito
        </Link>

        <Link to="/precios" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/precios')}`}>
          <Banknote size={20} />
          Lista de Precios
        </Link>

        <Link to="/exportacion" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/exportacion')}`}>
          <Globe size={20} />
          Lista Exportación (USD)
        </Link>
      </div>

      <div className="p-6 text-center text-xs text-slate-400/60">
        <p>&copy; 2025 Jobuzetti S.A.</p>
        <p>v1.3.0 Export</p>
      </div>
    </nav>
  );
};