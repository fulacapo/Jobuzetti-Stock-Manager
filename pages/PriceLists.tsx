import React, { useState, useEffect } from 'react';
import { getProducts, updateGlobalPrices, updateProduct } from '../services/storageService';
import { Product, CarLine } from '../types';
import { Search, FileText, Calculator, Download, RefreshCw, Filter, Table, Maximize2, Minimize2, Database, AlertTriangle, Eye, Pencil, Check, X, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PriceLists: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Generator State
  const [listTitle, setListTitle] = useState('Lista de Precios General');
  const [adjustment, setAdjustment] = useState<number>(0); // Percentage for PDF only
  const [selectedLines, setSelectedLines] = useState<string[]>([]); // Multi-brand
  const [searchTerm, setSearchTerm] = useState('');
  
  // Exclusion State
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  
  // Global Database Update State
  const [globalUpdatePct, setGlobalUpdatePct] = useState<number>(0);
  const [globalUpdateStatus, setGlobalUpdateStatus] = useState({ type: 'idle', msg: '' });

  // View State
  const [excelMode, setExcelMode] = useState(false);

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

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

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLine = selectedLines.length === 0 || selectedLines.includes(p.line);
    const notExcluded = !excludedIds.includes(p.id);
    
    return matchesSearch && matchesLine && notExcluded;
  }).sort((a, b) => a.line.localeCompare(b.line) || a.code.localeCompare(b.code, undefined, { numeric: true }));

  // Exclusion Handlers
  const handleExclude = (id: string) => {
      setExcludedIds(prev => [...prev, id]);
  };

  const handleRestoreExclusions = () => {
      setExcludedIds([]);
  };

  // Toggle Brand Selection
  const toggleLine = (line: string) => {
      if (selectedLines.includes(line)) {
          setSelectedLines(prev => prev.filter(l => l !== line));
      } else {
          setSelectedLines(prev => [...prev, line]);
      }
  };

  // Calculate Price Logic (PDF Preview only)
  const calculatePrice = (basePrice: number) => {
    if (!basePrice) return 0;
    return basePrice * (1 + (adjustment / 100));
  };

  // --- EDITING LOGIC ---

  const startEditing = (product: Product) => {
      setEditingId(product.id);
      setEditForm({
          code: product.code,
          name: product.name,
          line: product.line,
          details: product.details,
          stock: product.stock,
          price: product.price
      });
  };

  const cancelEditing = () => {
      setEditingId(null);
      setEditForm({});
  };

  const handleEditChange = (field: keyof Product, value: any) => {
      setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveEditing = async (id: string) => {
      try {
          await updateProduct(id, {
              code: editForm.code,
              name: editForm.name,
              line: editForm.line,
              details: editForm.details,
              stock: Number(editForm.stock),
              price: Number(editForm.price)
          });
          setEditingId(null);
          refreshData(); // Reload to show changes
      } catch (e) {
          alert("Error al guardar cambios.");
          console.error(e);
      }
  };

  // --- GLOBAL UPDATES ---

  const handleGlobalUpdate = async () => {
    if (globalUpdatePct === 0) return;
    const confirmMsg = `¿Estás seguro de aplicar un ${globalUpdatePct > 0 ? '+' : ''}${globalUpdatePct}% a ${selectedLines.length === 0 ? 'TODOS los productos' : `las marcas seleccionadas (${selectedLines.length})`}?\n\nEsta acción modificará la BASE DE DATOS permanentemente.`;
    
    if (window.confirm(confirmMsg)) {
        setGlobalUpdateStatus({ type: 'loading', msg: 'Actualizando base de datos...' });
        try {
            const result = await updateGlobalPrices(globalUpdatePct, selectedLines);
            setGlobalUpdateStatus({ type: 'success', msg: result });
            setGlobalUpdatePct(0);
            refreshData(); // Reload new prices
        } catch (e) {
            setGlobalUpdateStatus({ type: 'error', msg: 'Error al actualizar.' });
        }
    }
  };

  // PDF Generation
  const generatePDF = (action: 'download' | 'preview') => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    // Header
    doc.setFillColor(0, 85, 143); // Jobu Blue
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("JOBUZETTI S.A.", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Autopartes - Bisagras y Cierre de Capot", 14, 28);

    // Custom Title
    doc.setFontSize(16);
    doc.text(listTitle.toUpperCase(), 140, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Fecha de Emisión: ${today}`, 140, 28, { align: 'center' });
    
    if (adjustment !== 0) {
        const adjText = adjustment > 0 ? `Aumento aplicado: +${adjustment}%` : `Descuento aplicado: ${adjustment}%`;
        doc.text(adjText, 140, 35, { align: 'center' });
    }

    // Table
    const tableColumn = ["Código", "Línea", "Nombre", "Detalles", "Stock", "Precio"];
    const tableRows: any[] = [];

    filteredProducts.forEach(item => {
      const finalPrice = calculatePrice(item.price || 0);
      if (finalPrice === 0) return; // Skip Items without price

      const itemData = [
        item.code,
        item.line,
        item.name,
        item.details,
        item.stock,
        `$${finalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
      ];
      tableRows.push(itemData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [227, 6, 19] }, // Jobu Red
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
          0: { cellWidth: 18, fontStyle: 'bold' },
          1: { cellWidth: 22 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 50 },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
      }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Precios sujetos a cambios sin previo aviso.", 14, finalY + 10);
    doc.text("Generado por Sistema Jobuzetti S.A.", 200, finalY + 10, { align: 'right' });

    if (action === 'download') {
        doc.save(`Lista_Precios_${listTitle.replace(/\s+/g, '_')}.pdf`);
    } else {
        window.open(doc.output('bloburl'), '_blank');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-3rem)]">
      
      {/* LEFT: Configuration Panel */}
      {!excelMode && (
        <div className="w-full lg:w-1/3 bg-gray-800 rounded-2xl shadow-sm border border-gray-700 flex flex-col overflow-hidden animate-fade-in">
            <div className="p-6 bg-gray-900/50 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calculator className="text-jobu-blue" />
                    Configurar Lista
                </h2>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                
                {/* 1. Title */}
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Título del Documento (PDF)</label>
                    <input 
                        type="text"
                        value={listTitle}
                        onChange={(e) => setListTitle(e.target.value)}
                        className="w-full pl-4 p-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-jobu-blue outline-none font-medium shadow-sm placeholder-gray-500"
                    />
                </div>

                {/* 2. Multi-Select Filters */}
                <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-800/50 space-y-3">
                    <h3 className="font-bold text-blue-300 text-sm uppercase tracking-wide flex items-center gap-2">
                        <Filter size={16} /> Seleccionar Marcas
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
                                        ? 'bg-jobu-blue text-white border-jobu-blue shadow-sm' 
                                        : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-blue-400'
                                    }`}
                                >
                                    {line}
                                </button>
                            );
                        })}
                    </div>
                    <div className="text-xs text-right text-blue-400 font-medium">
                        {selectedLines.length === 0 ? 'Mostrando Todas' : `${selectedLines.length} seleccionadas`}
                    </div>

                     <div>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar código específico..."
                                className="w-full pl-8 p-2 bg-gray-800 border border-blue-800/50 rounded-lg text-sm text-white outline-none focus:border-blue-400"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Temp Adjustment */}
                <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600">
                    <h3 className="font-bold text-gray-300 text-sm uppercase tracking-wide flex items-center gap-2 mb-3">
                        <RefreshCw size={16} /> Ajuste Temporal (Solo PDF)
                    </h3>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number"
                            value={adjustment}
                            onChange={(e) => setAdjustment(Number(e.target.value))}
                            className={`flex-1 p-2 border-2 rounded-lg text-center font-bold outline-none bg-gray-800 text-white ${
                                adjustment !== 0 ? 'border-jobu-blue text-jobu-blue' : 'border-gray-600'
                            }`}
                        />
                        <span className="text-gray-500 font-bold">%</span>
                    </div>
                </div>

                {/* 4. DANGEROUS: Database Update */}
                <div className="bg-red-900/20 p-4 rounded-xl border border-red-900/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 text-red-900/20">
                        <Database size={60} className="opacity-20" />
                    </div>
                    <h3 className="font-bold text-red-400 text-sm uppercase tracking-wide flex items-center gap-2 mb-2 relative z-10">
                        <AlertTriangle size={16} /> Gestión de Precios Base
                    </h3>
                    <p className="text-xs text-red-300 mb-3 relative z-10">
                        <strong>¡CUIDADO!</strong> Esto aplicará un aumento/descuento PERMANENTE a la base de datos de Firebase para las marcas seleccionadas.
                    </p>

                    <div className="flex items-center gap-2 relative z-10">
                        <input 
                            type="number"
                            value={globalUpdatePct}
                            onChange={(e) => setGlobalUpdatePct(Number(e.target.value))}
                            className="w-20 p-2 bg-gray-900 border border-red-800 rounded-lg text-center font-bold text-red-400 outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="0"
                        />
                        <span className="text-red-500 font-bold">%</span>
                        <button 
                            onClick={handleGlobalUpdate}
                            disabled={globalUpdatePct === 0 || globalUpdateStatus.type === 'loading'}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-lg shadow transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                            {globalUpdateStatus.type === 'loading' ? '...' : 'ACTUALIZAR BD'}
                        </button>
                    </div>
                    {globalUpdateStatus.msg && (
                        <p className={`text-xs mt-2 font-bold ${globalUpdateStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {globalUpdateStatus.msg}
                        </p>
                    )}
                </div>

            </div>

            <div className="p-6 bg-gray-800 border-t border-gray-700 grid grid-cols-2 gap-3">
                <button 
                    onClick={() => generatePDF('preview')}
                    className="col-span-1 bg-transparent text-jobu-blue border-2 border-jobu-blue py-3 rounded-xl font-bold hover:bg-blue-900/20 transition-all flex justify-center items-center gap-2"
                >
                    <Eye size={20} />
                    Ver PDF
                </button>
                <button 
                    onClick={() => generatePDF('download')}
                    className="col-span-1 bg-jobu-blue text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-600 transition-all flex justify-center items-center gap-2"
                >
                    <Download size={20} />
                    Descargar
                </button>
            </div>
        </div>
      )}

      {/* RIGHT: Live Preview / Excel View */}
      <div className={`flex-1 bg-gray-800 rounded-2xl shadow-sm border border-gray-700 flex flex-col overflow-hidden transition-all duration-300 ${excelMode ? 'w-full' : ''}`}>
        <div className={`${excelMode ? 'bg-green-800' : 'bg-gray-900'} text-white p-4 flex justify-between items-center transition-colors`}>
            <div className="flex items-center gap-4">
                <h3 className="font-medium flex items-center gap-2">
                    {excelMode ? <Table size={20} /> : <FileText size={20} />}
                    {excelMode ? 'Vista Tipo Excel' : 'Vista Previa de Datos'}
                </h3>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs text-white">
                    {filteredProducts.length} items
                </span>
                {adjustment !== 0 && (
                    <span className={`text-xs font-bold px-3 py-1 rounded ${adjustment > 0 ? 'bg-green-600' : 'bg-red-600'}`}>
                        {adjustment > 0 ? `Vista: +${adjustment}%` : `Vista: ${adjustment}%`}
                    </span>
                )}
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
            
            <button 
                onClick={() => setExcelMode(!excelMode)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
                {excelMode ? (
                    <>
                        <Minimize2 size={16} /> Salir de Excel
                    </>
                ) : (
                    <>
                        <Maximize2 size={16} /> Vista Excel
                    </>
                )}
            </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-800">
            {loading ? (
                <div className="flex justify-center items-center h-full">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jobu-blue"></div>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p>No hay productos que coincidan con los filtros.</p>
                </div>
            ) : (
                <table className={`w-full text-left ${excelMode ? 'border-collapse text-xs font-mono' : 'border-collapse'}`}>
                    <thead className={`sticky top-0 z-10 shadow-sm ${excelMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-900/50'}`}>
                        <tr>
                            <th className={`font-bold text-gray-400 uppercase ${excelMode ? 'border border-gray-600 p-2' : 'p-3 text-xs'}`}>Código</th>
                            <th className={`font-bold text-gray-400 uppercase ${excelMode ? 'border border-gray-600 p-2' : 'p-3 text-xs'}`}>Nombre</th>
                            <th className={`font-bold text-gray-400 uppercase ${excelMode ? 'border border-gray-600 p-2' : 'p-3 text-xs'}`}>Línea</th>
                            <th className={`font-bold text-gray-400 uppercase ${excelMode ? 'border border-gray-600 p-2' : 'p-3 text-xs'}`}>Detalles</th>
                            <th className={`font-bold text-gray-400 uppercase text-center ${excelMode ? 'border border-gray-600 p-2' : 'p-3 text-xs'}`}>Stock</th>
                            <th className={`font-bold text-blue-300 uppercase text-right bg-blue-900/20 ${excelMode ? 'border border-gray-600 p-2' : 'p-3 text-xs'}`}>Precio Final</th>
                            <th className={`font-bold text-gray-400 uppercase text-center ${excelMode ? 'border border-gray-600 p-2' : 'p-3 text-xs'}`}>Editar</th>
                            <th className={`font-bold text-gray-400 uppercase text-center ${excelMode ? 'border border-gray-600 p-2' : 'p-3 text-xs'}`}>Ocultar</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y divide-gray-700 ${excelMode ? 'text-gray-300' : 'text-sm'}`}>
                        {filteredProducts.map((product, idx) => {
                            const isEditing = editingId === product.id;
                            const base = product.price || 0;
                            const final = calculatePrice(base);

                            if (isEditing) {
                                return (
                                    <tr key={product.id} className="bg-blue-900/30 animate-fade-in">
                                        <td className="p-2"><input type="text" value={editForm.code} onChange={e => handleEditChange('code', e.target.value)} className="w-full bg-gray-900 border-2 border-blue-500 text-white px-3 py-2 text-sm font-bold rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" /></td>
                                        <td className="p-2"><input type="text" value={editForm.name} onChange={e => handleEditChange('name', e.target.value)} className="w-full bg-gray-900 border-2 border-blue-500 text-white px-3 py-2 text-sm font-bold rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" /></td>
                                        <td className="p-2">
                                            <select value={editForm.line} onChange={e => handleEditChange('line', e.target.value)} className="w-full bg-gray-900 border-2 border-blue-500 text-white px-3 py-2 text-sm font-bold rounded-lg focus:ring-2 focus:ring-blue-400 outline-none">
                                                {Object.values(CarLine).map(line => <option key={line} value={line}>{line}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2"><input type="text" value={editForm.details} onChange={e => handleEditChange('details', e.target.value)} className="w-full bg-gray-900 border-2 border-blue-500 text-white px-3 py-2 text-sm font-bold rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" /></td>
                                        <td className="p-2"><input type="number" value={editForm.stock} onChange={e => handleEditChange('stock', Number(e.target.value))} className="w-full bg-gray-900 border-2 border-blue-500 text-white px-3 py-2 text-sm font-bold rounded-lg text-center focus:ring-2 focus:ring-blue-400 outline-none" /></td>
                                        <td className="p-2 relative">
                                            {adjustment !== 0 && <span className="absolute -top-1 right-2 text-[10px] font-bold text-yellow-400 bg-gray-900 px-1.5 py-0.5 border border-yellow-500/30 rounded shadow-sm z-10">Precio Base</span>}
                                            <input type="number" value={editForm.price} onChange={e => handleEditChange('price', Number(e.target.value))} className="w-full bg-gray-900 border-2 border-blue-500 text-white px-3 py-2 text-sm font-bold rounded-lg text-right focus:ring-2 focus:ring-blue-400 outline-none" />
                                        </td>
                                        <td className="p-2 text-center align-middle">
                                            <div className="flex justify-center items-center gap-2 h-full">
                                                <button onClick={() => saveEditing(product.id)} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-500 shadow-lg transition-all transform hover:scale-110" title="Guardar"><Check size={20} /></button>
                                                <button onClick={cancelEditing} className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-500 shadow-lg transition-all transform hover:scale-110" title="Cancelar"><X size={20} /></button>
                                            </div>
                                        </td>
                                        <td></td>
                                    </tr>
                                );
                            }

                            return (
                                <tr key={product.id} className={`hover:bg-gray-700 transition-colors ${excelMode && idx % 2 === 0 ? 'bg-gray-800/50' : ''}`}>
                                    <td className={`${excelMode ? 'border border-gray-600 p-1 font-bold' : 'p-3 font-medium text-white'}`}>
                                        {product.code}
                                    </td>
                                    <td className={`${excelMode ? 'border border-gray-600 p-1' : 'p-3 text-gray-300'}`}>
                                        {product.name}
                                    </td>
                                    <td className={`${excelMode ? 'border border-gray-600 p-1' : 'p-3 text-gray-400 text-xs uppercase'}`}>
                                        {product.line}
                                    </td>
                                    <td className={`${excelMode ? 'border border-gray-600 p-1' : 'p-3 text-gray-400 text-xs'}`}>
                                        {product.details}
                                    </td>
                                    <td className={`${excelMode ? 'border border-gray-600 p-1 text-center' : 'p-3 text-center text-gray-400'}`}>
                                        {product.stock}
                                    </td>
                                    <td className={`${excelMode ? 'border border-gray-600 p-1 text-right font-bold bg-green-900/20' : 'p-3 text-right font-bold bg-blue-900/10'} ${adjustment !== 0 ? (adjustment > 0 ? 'text-green-400' : 'text-red-400') : 'text-white'}`}>
                                        {final > 0 ? `$${final.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Consultar'}
                                    </td>
                                    <td className={`${excelMode ? 'border border-gray-600 p-1 text-center' : 'p-3 text-center'}`}>
                                        <button onClick={() => startEditing(product)} className="text-gray-400 hover:text-white p-1 hover:bg-gray-600 rounded transition-colors" title="Editar Producto">
                                            <Pencil size={14} />
                                        </button>
                                    </td>
                                    <td className={`${excelMode ? 'border border-gray-600 p-1 text-center' : 'p-3 text-center'}`}>
                                        <button onClick={() => handleExclude(product.id)} className="text-red-500 hover:text-red-400 p-1 hover:bg-gray-600 rounded transition-colors" title="Ocultar de la lista">
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