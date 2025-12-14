import React, { useState, useEffect } from 'react';
import { getProducts, updateProduct } from '../services/storageService';
import { Product, CarLine } from '../types';
import { Search, Download, Globe, Check, X, Pencil, Languages, Filter, Eye, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ExportPriceLists: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Configuration State
  const [listTitle, setListTitle] = useState('EXPORT PRICE LIST');
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Exclusion State
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  
  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{priceUsd: number, detailsEn: string}>({ priceUsd: 0, detailsEn: '' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLoading(true);
    getProducts().then(data => {
        setProducts(data);
        setLoading(false);
    });
  }

  // --- AUTO TRANSLATION LOGIC ---
  const autoTranslate = (text: string, name: string): string => {
    const combined = `${name} ${text}`.toUpperCase();
    
    // Simple Dictionary for Auto Parts
    const dictionary: Record<string, string> = {
        "DERECHA": "RIGHT",
        "IZQUIERDA": "LEFT",
        "DELANTERA": "FRONT",
        "TRASERA": "REAR",
        "CAPOT": "HOOD",
        "PUERTA": "DOOR",
        "PORTON": "TAILGATE",
        "BISAGRA": "HINGE",
        "CIERRE": "LATCH",
        "CABLE": "CABLE",
        "RESORTE": "SPRING",
        "RETEN": "RETAINER",
        "JUEGO": "SET",
        "SOPORTE": "BRACKET",
        "MANIJA": "HANDLE",
        "CERRADURA": "LOCK",
        "COMANDO": "CONTROL",
        "TENSORES": "CHECK STRAP",
        "RIENDA": "STRAP",
        "CAMION": "TRUCK",
        "PICK UP": "PICKUP",
        "LATERAL": "SIDE",
        "CENTRAL": "CENTRAL",
        "SUPERIOR": "UPPER",
        "INFERIOR": "LOWER"
    };

    // Replace known words in the original details
    let translated = text.toUpperCase();
    Object.keys(dictionary).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        translated = translated.replace(regex, dictionary[key]);
    });

    // If details were empty, try to construct from Name
    if (!translated || translated.length < 3) {
        translated = name.toUpperCase();
        Object.keys(dictionary).forEach(key => {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            translated = translated.replace(regex, dictionary[key]);
        });
    }

    return translated.charAt(0) + translated.slice(1).toLowerCase(); // Capitalize first letter
  };

  // --- FILTERING ---
  const toggleLine = (line: string) => {
      if (selectedLines.includes(line)) {
          setSelectedLines(prev => prev.filter(l => l !== line));
      } else {
          setSelectedLines(prev => [...prev, line]);
      }
  };

  // Exclusion Handlers
  const handleExclude = (id: string) => {
      setExcludedIds(prev => [...prev, id]);
  };

  const handleRestoreExclusions = () => {
      setExcludedIds([]);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLine = selectedLines.length === 0 || selectedLines.includes(p.line);
    const notExcluded = !excludedIds.includes(p.id);
    
    return matchesSearch && matchesLine && notExcluded;
  }).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));


  // --- EDITING ---
  const startEditing = (product: Product) => {
      setEditingId(product.id);
      
      // Use existing translation or generate one
      const currentEn = product.detailsEn || autoTranslate(product.details, product.name);
      
      setEditForm({
          priceUsd: product.priceUsd || 0,
          detailsEn: currentEn
      });
  };

  const saveEditing = async (id: string) => {
      try {
          await updateProduct(id, {
              priceUsd: Number(editForm.priceUsd),
              detailsEn: editForm.detailsEn
          });
          setEditingId(null);
          refreshData();
      } catch (e) {
          alert("Error al guardar cambios.");
      }
  };

  // --- PDF GENERATION ---
  const generatePDF = (action: 'download' | 'preview') => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    // Header
    doc.setFillColor(20, 20, 20); // Dark Header for Export
    doc.rect(0, 0, 210, 40, 'F');

    // Logo / Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("JOBUZETTI S.A.", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Auto Parts Manufacturer - Argentina", 14, 28);

    // Custom Title
    doc.setFontSize(16);
    doc.text(listTitle.toUpperCase(), 196, 20, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`Date: ${today} | Currency: USD`, 196, 28, { align: 'right' });

    // Table
    const tableColumn = ["Code", "Line", "Description (English)", "Stock", "Price USD"];
    const tableRows: any[] = [];

    filteredProducts.forEach(item => {
      const price = item.priceUsd || 0;
      const details = item.detailsEn || autoTranslate(item.details, item.name);
      
      const itemData = [
        item.code,
        item.line,
        details,
        item.stock,
        price === 0 ? '-' : `$${price.toFixed(2)}`
      ];
      tableRows.push(itemData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'striped',
      headStyles: { fillColor: [0, 85, 143] }, // Jobu Blue
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
          0: { cellWidth: 20, fontStyle: 'bold' },
          1: { cellWidth: 25 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
      }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Prices valid for 30 days. FOB Argentina.", 14, finalY + 10);

    if (action === 'download') {
        doc.save(`Jobuzetti_Export_${listTitle.replace(/\s+/g, '_')}.pdf`);
    } else {
        window.open(doc.output('bloburl'), '_blank');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-3rem)]">
      
      {/* LEFT: Configuration Panel */}
      <div className="w-full lg:w-1/3 bg-gray-800 rounded-2xl shadow-sm border border-gray-700 flex flex-col overflow-hidden animate-fade-in">
            <div className="p-6 bg-gray-900/50 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe className="text-green-400" />
                    Configurar Exportación
                </h2>
                <p className="text-xs text-gray-400 mt-1">Gestión de precios internacionales USD.</p>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                
                {/* 1. Title */}
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Título del Documento (PDF)</label>
                    <input 
                        type="text"
                        value={listTitle}
                        onChange={(e) => setListTitle(e.target.value)}
                        className="w-full pl-4 p-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none font-medium shadow-sm placeholder-gray-500"
                    />
                </div>

                {/* 2. Multi-Select Filters */}
                <div className="bg-green-900/10 p-4 rounded-xl border border-green-800/30 space-y-3">
                    <h3 className="font-bold text-green-400 text-sm uppercase tracking-wide flex items-center gap-2">
                        <Filter size={16} /> Filtrar Marcas
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {Object.values(CarLine).map(line => {
                            const isActive = selectedLines.includes(line);
                            return (
                                <button
                                    key={line}
                                    onClick={() => toggleLine(line)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                        isActive 
                                        ? 'bg-green-600 text-white border-green-500 shadow-sm' 
                                        : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-green-400'
                                    }`}
                                >
                                    {line}
                                </button>
                            );
                        })}
                    </div>
                    <div className="text-xs text-right text-green-400 font-medium">
                        {selectedLines.length === 0 ? 'Mostrando Todas' : `${selectedLines.length} seleccionadas`}
                    </div>

                     <div>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar producto..."
                                className="w-full pl-8 p-2 bg-gray-800 border border-green-800/50 rounded-lg text-sm text-white outline-none focus:border-green-400"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-gray-800 border-t border-gray-700 grid grid-cols-2 gap-3">
                <button 
                    onClick={() => generatePDF('preview')}
                    className="col-span-1 bg-transparent text-green-400 border-2 border-green-500 py-3 rounded-xl font-bold hover:bg-green-900/20 transition-all flex justify-center items-center gap-2"
                >
                    <Eye size={20} />
                    Ver PDF
                </button>
                <button 
                    onClick={() => generatePDF('download')}
                    className="col-span-1 bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-green-500 transition-all flex justify-center items-center gap-2"
                >
                    <Download size={20} />
                    Descargar
                </button>
            </div>
      </div>

      {/* RIGHT: Table */}
      <div className="flex-1 bg-gray-800 rounded-2xl shadow-sm border border-gray-700 overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <Languages size={18} className="text-gray-400" />
                <span className="text-sm text-gray-400 hidden sm:inline">
                    Traducción automática activa.
                </span>
             </div>
             <div className="flex items-center gap-3">
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-white">
                    {filteredProducts.length} items
                </span>
                {excludedIds.length > 0 && (
                    <button 
                        onClick={handleRestoreExclusions}
                        className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                    >
                        <RotateCcw size={14} />
                        Restaurar ({excludedIds.length})
                    </button>
                )}
             </div>
        </div>
        
        <div className="flex-1 overflow-auto">
            {loading ? (
                <div className="flex justify-center items-center h-full">
                     <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Globe size={48} className="mb-4 opacity-20" />
                    <p>No hay productos con los filtros seleccionados.</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-900/80 sticky top-0 z-10 text-gray-300 uppercase text-xs tracking-wider">
                        <tr>
                            <th className="p-4 font-bold border-b border-gray-700">Código</th>
                            <th className="p-4 font-bold border-b border-gray-700">Línea</th>
                            <th className="p-4 font-bold border-b border-gray-700 w-1/3">
                                Descripción (Inglés)
                            </th>
                            <th className="p-4 font-bold border-b border-gray-700 text-center">Stock</th>
                            <th className="p-4 font-bold border-b border-gray-700 text-right w-40">Precio USD</th>
                            <th className="p-4 font-bold border-b border-gray-700 text-center w-24">Editar</th>
                            <th className="p-4 font-bold border-b border-gray-700 text-center w-24">Ocultar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 text-sm">
                        {filteredProducts.map(product => {
                            const isEditing = editingId === product.id;
                            const displayEn = product.detailsEn || autoTranslate(product.details, product.name);

                            if (isEditing) {
                                return (
                                    <tr key={product.id} className="bg-green-900/20 animate-fade-in">
                                        <td className="p-4 font-bold text-white">{product.code}</td>
                                        <td className="p-4 text-gray-400">{product.line}</td>
                                        <td className="p-4">
                                            <input 
                                                type="text" 
                                                value={editForm.detailsEn} 
                                                onChange={(e) => setEditForm(prev => ({...prev, detailsEn: e.target.value}))}
                                                className="w-full bg-gray-900 border-2 border-green-500 text-white px-3 py-2 rounded-lg focus:outline-none font-medium"
                                                autoFocus
                                            />
                                        </td>
                                        <td className="p-4 text-center text-gray-400">{product.stock}</td>
                                        <td className="p-4">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-bold">$</span>
                                                <input 
                                                    type="number" 
                                                    value={editForm.priceUsd} 
                                                    onChange={(e) => setEditForm(prev => ({...prev, priceUsd: Number(e.target.value)}))}
                                                    className="w-full bg-gray-900 border-2 border-green-500 text-white pl-6 pr-3 py-2 rounded-lg focus:outline-none font-bold text-right"
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => saveEditing(product.id)} className="bg-green-600 p-2 rounded-lg hover:bg-green-500 text-white shadow"><Check size={18}/></button>
                                                <button onClick={() => setEditingId(null)} className="bg-gray-600 p-2 rounded-lg hover:bg-gray-500 text-white shadow"><X size={18}/></button>
                                            </div>
                                        </td>
                                        <td></td>
                                    </tr>
                                )
                            }

                            return (
                                <tr key={product.id} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 font-bold text-white border-r border-gray-700/50">{product.code}</td>
                                    <td className="p-4 text-gray-400 text-xs uppercase font-bold tracking-wide">{product.line}</td>
                                    <td className="p-4 text-gray-300 italic">
                                        {displayEn}
                                        {!product.detailsEn && <span className="ml-2 text-[10px] bg-gray-700 px-1 rounded text-gray-500 not-italic">AUTO</span>}
                                    </td>
                                    <td className="p-4 text-center text-gray-500">{product.stock}</td>
                                    <td className={`p-4 text-right font-mono font-bold text-lg ${product.priceUsd ? 'text-green-400' : 'text-gray-600'}`}>
                                        {product.priceUsd ? `$${product.priceUsd.toFixed(2)}` : '$0.00'}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => startEditing(product)} 
                                            className="text-gray-500 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => handleExclude(product.id)} 
                                            className="text-red-500 hover:text-red-400 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                            title="Ocultar de exportación"
                                        >
                                            <X size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
};