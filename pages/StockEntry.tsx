import React, { useState, useEffect } from 'react';
import { getProducts, updateStock } from '../services/storageService';
import { Product } from '../types';
import { Search, CheckCircle, AlertCircle, Save, ChevronRight } from 'lucide-react';

export const StockEntry: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  useEffect(() => {
    getProducts().then(setProducts);
  }, [status]); // Reload on success

  // Update suggestions as user types
  useEffect(() => {
    if (!searchCode.trim() || selectedProduct) {
        setSuggestions([]);
        return;
    }

    const term = searchCode.toLowerCase();
    const matches = products.filter(p => 
        p.code.toLowerCase().includes(term) || 
        p.name.toLowerCase().includes(term)
    ).slice(0, 6); // Limit to 6 suggestions

    setSuggestions(matches);
  }, [searchCode, products, selectedProduct]);

  const handleSearch = () => {
    // Exact match priority, then first partial match
    const term = searchCode.toLowerCase();
    const found = products.find(p => p.code.toLowerCase() === term) || products.find(p => p.code.toLowerCase().includes(term));
    
    if (found) {
        selectProduct(found);
    } else {
        setSelectedProduct(null);
        setStatus('idle');
    }
  };

  const selectProduct = (product: Product) => {
      setSelectedProduct(product);
      setSearchCode(product.code); // Fill input with exact code
      setSuggestions([]); // Hide suggestions
      setQuantityToAdd(0);
      setStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantityToAdd <= 0) return;

    try {
        await updateStock(selectedProduct.id, Number(quantityToAdd));
        setStatus('success');
        setTimeout(() => {
            setStatus('idle');
            setSelectedProduct(null);
            setSearchCode('');
            setQuantityToAdd(0);
        }, 2000);
    } catch (error) {
        setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 overflow-visible">
        <div className="p-6 border-b border-gray-700 bg-gray-900/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Save size={24} className="text-jobu-blue" />
                Ingreso de Stock
            </h2>
            <p className="text-sm text-gray-400 mt-1">Escriba el código para ver sugerencias y sumar cantidades.</p>
        </div>
        
        <div className="p-8 space-y-8 min-h-[400px]">
            {/* Search Section */}
            <div className="flex gap-4 relative z-20">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        value={searchCode}
                        onChange={(e) => {
                            setSearchCode(e.target.value);
                            if (selectedProduct) setSelectedProduct(null); // Reset selection if user types
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Ingrese código (ej: 796D)..."
                        autoComplete="off"
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl focus:border-jobu-blue focus:ring-0 outline-none text-lg font-medium uppercase transition-colors text-white placeholder-gray-500"
                    />

                    {/* Autocomplete Dropdown */}
                    {suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                            {suggestions.map((item) => (
                                <div 
                                    key={item.id}
                                    onClick={() => selectProduct(item)}
                                    className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0 flex items-center justify-between group"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-jobu-blue text-lg">{item.code}</span>
                                            <span className="text-xs bg-gray-900 text-gray-400 px-2 py-0.5 rounded border border-gray-700">{item.line}</span>
                                        </div>
                                        <p className="text-sm text-gray-300">{item.name}</p>
                                    </div>
                                    <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" size={18} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button 
                    onClick={handleSearch}
                    className="bg-jobu-blue text-white px-6 rounded-xl font-medium hover:bg-blue-600 transition-colors h-[54px]"
                >
                    Buscar
                </button>
            </div>

            {/* Result Section */}
            {selectedProduct ? (
                <form onSubmit={handleSubmit} className="bg-gray-700/50 border border-gray-600 rounded-xl p-6 animate-fade-in relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">{selectedProduct.name}</h3>
                            <p className="text-gray-400">{selectedProduct.details}</p>
                            <span className="inline-block mt-2 text-xs font-bold bg-gray-800 px-2 py-1 rounded border border-gray-600 text-blue-300">
                                Línea: {selectedProduct.line}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-400">Stock Actual</p>
                            <p className="text-3xl font-bold text-jobu-blue">{selectedProduct.stock}</p>
                        </div>
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Cantidad a Ingresar</label>
                            <input 
                                type="number" 
                                min="1"
                                value={quantityToAdd}
                                onChange={(e) => setQuantityToAdd(parseInt(e.target.value))}
                                autoFocus
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-jobu-blue focus:border-transparent outline-none text-lg text-white"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={quantityToAdd <= 0}
                            className="bg-jobu-blue text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-900/20"
                        >
                            Confirmar Ingreso
                        </button>
                    </div>
                </form>
            ) : searchCode && !selectedProduct && status === 'idle' && suggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 animate-fade-in">
                    <AlertCircle className="mx-auto mb-2" />
                    <p>No se encontró ningún producto con el código "{searchCode}"</p>
                </div>
            ) : null}

            {/* Status Messages */}
            {status === 'success' && (
                <div className="bg-green-900/30 text-green-400 border border-green-800 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                    <CheckCircle size={24} />
                    <div>
                        <p className="font-bold">¡Actualización exitosa!</p>
                        <p className="text-sm">El stock ha sido actualizado correctamente.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};