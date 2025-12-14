import React, { useState } from 'react';
import { Product } from '../types';
import { Box, X, ZoomIn } from 'lucide-react';

interface Props {
  product: Product;
  actionSlot?: React.ReactNode;
}

// Helper to determine stock status styling
const getStockStatusStyle = (stock: number) => {
    if (stock > 20) return 'bg-green-900/50 text-green-300 border border-green-800';
    if (stock > 5) return 'bg-yellow-900/50 text-yellow-300 border border-yellow-800';
    return 'bg-red-900/50 text-red-300 border border-red-800';
};

const getStockStatusText = (stock: number) => {
    return stock > 0 ? `Stock: ${stock}` : 'Sin Stock';
};

export const ProductCard: React.FC<Props> = ({ product, actionSlot }) => {
  const [showModal, setShowModal] = useState(false);
  const stockStyle = getStockStatusStyle(product.stock);

  return (
    <>
      {/* Card Component */}
      <div 
        onClick={() => setShowModal(true)}
        className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden hover:shadow-md hover:border-gray-600 transition-all cursor-pointer group relative flex flex-col h-full"
      >
        {/* Header Image Area */}
        <div className="h-40 bg-white flex items-center justify-center relative border-b border-gray-700 overflow-hidden">
           {product.imageUrl ? (
               <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110" 
               />
           ) : (
               <div className="flex flex-col items-center text-gray-400">
                   <Box size={40} />
                   <span className="text-xs mt-2">Sin imagen</span>
               </div>
           )}
           
           <span className="absolute top-2 right-2 bg-jobu-blue text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
               {product.code}
           </span>

           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors z-0">
             <ZoomIn className="text-jobu-blue opacity-0 group-hover:opacity-100 drop-shadow-lg transform scale-75 group-hover:scale-100 transition-all duration-300" size={32} />
           </div>
        </div>

        {/* Info Body */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-700 px-2 py-1 rounded border border-gray-600">
                  {product.line}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${stockStyle}`}>
                  {getStockStatusText(product.stock)}
              </span>
          </div>
          
          <h3 className="text-white font-bold leading-tight mb-1 group-hover:text-jobu-blue transition-colors">
              {product.name}
          </h3>
          <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2">
              {product.details}
          </p>
          
          <div className="mt-auto pt-3 border-t border-gray-700" onClick={(e) => e.stopPropagation()}>
              {actionSlot}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden relative flex flex-col md:flex-row animate-scale-in border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-20 bg-gray-700/90 backdrop-blur p-2 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-900/30 transition-colors shadow-sm border border-gray-600"
            >
              <X size={20} />
            </button>

            {/* Left: Image */}
            <div className="w-full md:w-1/2 h-64 md:h-auto bg-white flex items-center justify-center relative border-b md:border-b-0 md:border-r border-gray-700">
               {product.imageUrl ? (
                 <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4" />
               ) : (
                 <div className="flex flex-col items-center text-gray-400">
                     <Box size={64} />
                     <span className="mt-4 font-medium text-lg">Sin imagen disponible</span>
                 </div>
               )}
               <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-gray-300 shadow-sm border border-gray-600">
                  ID: {product.id}
               </div>
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-between text-white">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-jobu-blue text-white px-4 py-1.5 rounded-lg font-bold text-lg shadow-sm tracking-wide">
                      {product.code}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest border border-gray-600 px-2 py-1 rounded bg-gray-700">
                      {product.line}
                  </span>
                </div>

                <h2 className="text-3xl font-bold text-white leading-tight mb-6">{product.name}</h2>

                <div className="space-y-6">
                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción & Detalles</h4>
                        <p className="text-gray-200 text-lg leading-relaxed">{product.details}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Stock Disponible</h4>
                            <div className={`inline-flex items-center gap-2 text-lg font-bold ${
                                product.stock > 20 ? 'text-green-400' : product.stock > 5 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                                <span>{product.stock}</span>
                                <span className="text-xs font-medium text-gray-400 uppercase">Unidades</span>
                            </div>
                        </div>

                        {product.price && product.price > 0 && (
                            <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600 text-right">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Precio Ref.</h4>
                                <p className="text-xl font-bold text-white">${product.price.toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-700 flex justify-end">
                <button 
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors border border-gray-600"
                >
                    Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
