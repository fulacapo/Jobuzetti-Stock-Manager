import React, { useEffect, useState } from 'react';
import { getProducts } from '../services/storageService';
import { Product, CarLine } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Search, Filter, ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'code' | 'name' | 'line' | 'stock';
type SortOrder = 'asc' | 'desc';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLine, setFilterLine] = useState<string>('ALL');

  // Sort States
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    const load = async () => {
      const data = await getProducts();
      setProducts(data);
      setLoading(false);
    };
    load();
  }, []);

  // 1. Filter
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLine = filterLine === 'ALL' || p.line === filterLine;
    return matchesSearch && matchesLine;
  });

  // 2. Sort
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'stock':
        comparison = a.stock - b.stock;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'line':
        comparison = a.line.localeCompare(b.line);
        break;
      case 'code':
      default:
        // Natural sort for mixed alphanumeric codes (e.g. 796D vs 1001)
        comparison = a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-700">
        <div>
            <h2 className="text-2xl font-bold text-white">Inventario General</h2>
            <p className="text-gray-400">Visualización completa de autopartes y stock disponible.</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-end lg:items-center">
            {/* Search */}
            <div className="relative w-full lg:w-auto lg:flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por código, nombre o detalles..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-jobu-blue focus:border-transparent outline-none text-white placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
                {/* Filter Dropdown */}
                <div className="relative flex-1 lg:flex-none">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select 
                        className="w-full pl-9 pr-8 py-2.5 bg-gray-700 border border-gray-600 rounded-xl appearance-none focus:ring-2 focus:ring-jobu-blue outline-none text-white font-medium cursor-pointer"
                        value={filterLine}
                        onChange={(e) => setFilterLine(e.target.value)}
                    >
                        <option value="ALL">Todas las Líneas</option>
                        {Object.values(CarLine).map(line => (
                            <option key={line} value={line}>{line}</option>
                        ))}
                    </select>
                </div>

                {/* Sort Dropdown */}
                <div className="relative flex-1 lg:flex-none">
                    <select 
                        className="w-full pl-4 pr-8 py-2.5 bg-gray-700 border border-gray-600 rounded-xl appearance-none focus:ring-2 focus:ring-jobu-blue outline-none text-white font-medium cursor-pointer"
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value as SortField)}
                    >
                        <option value="code">Orden: Código</option>
                        <option value="name">Orden: Nombre</option>
                        <option value="stock">Orden: Stock</option>
                        <option value="line">Orden: Línea</option>
                    </select>
                </div>

                {/* Sort Direction Btn */}
                <button 
                    onClick={toggleSortOrder}
                    className="bg-gray-700 border border-gray-600 p-2.5 rounded-xl hover:bg-gray-600 text-white transition-colors"
                    title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                >
                    {sortOrder === 'asc' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                </button>
            </div>
        </div>
      </header>

      {/* Grid Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jobu-blue"></div>
        </div>
      ) : sortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-800 rounded-2xl border border-gray-700">
            <div className="inline-block p-4 rounded-full bg-gray-700 mb-4">
                <Search size={40} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No se encontraron productos</h3>
            <p className="text-gray-400">Intenta cambiar los filtros o el término de búsqueda.</p>
        </div>
      )}
    </div>
  );
};