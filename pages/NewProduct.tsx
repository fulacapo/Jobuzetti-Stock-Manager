import React, { useState } from 'react';
import { addProduct, bulkAddProducts } from '../services/storageService';
import { CarLine, Product } from '../types';
import { PackagePlus, CheckCircle, UploadCloud, AlertTriangle, Info } from 'lucide-react';

export const NewProduct: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  
  // Single Form State
  const [form, setForm] = useState({
    code: '',
    name: '',
    line: CarLine.FORD,
    details: '',
    stock: 0,
    price: 0,
    imageUrl: ''
  });
  
  // Bulk Form State
  const [csvText, setCsvText] = useState('');
  const [bulkStatus, setBulkStatus] = useState<{type: 'idle'|'loading'|'success'|'error', msg: string}>({ type: 'idle', msg: '' });

  const handleSingleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addProduct({
        ...form,
        stock: Number(form.stock),
        price: Number(form.price)
    });
    setBulkStatus({ type: 'success', msg: 'Producto creado exitosamente' });
    setForm({ code: '', name: '', line: CarLine.FORD, details: '', stock: 0, price: 0, imageUrl: '' });
    setTimeout(() => setBulkStatus({ type: 'idle', msg: '' }), 3000);
  };

  const handleBulkSubmit = async () => {
    if (!csvText.trim()) return;
    setBulkStatus({ type: 'loading', msg: 'Procesando datos...' });

    try {
        const lines = csvText.trim().split('\n');
        const newProducts: Omit<Product, 'id'>[] = [];
        const errors: string[] = [];

        lines.forEach((line, index) => {
            if (!line.trim()) return;

            // Check for semicolon first (user preference), then comma
            const separator = line.includes(';') ? ';' : ',';
            const parts = line.split(separator);

            // Skip header row if detected
            const firstCol = parts[0].toUpperCase().trim();
            if (firstCol === 'CÓDIGO' || firstCol === 'CODIGO' || firstCol === 'CODE') {
                return;
            }

            if (parts.length < 4) {
                errors.push(`Línea ${index + 1}: Formato inválido (Faltan columnas)`);
                return;
            }

            // Mapping based on user's CSV: CÓDIGO;NOMBRE;LÍNEA;DETALLES;STOCK;PRECIO
            const [code, name, lineStr, details, stockStr, priceStr] = parts;
            
            // Normalize Line
            let carLine = CarLine.UNIVERSAL;
            const normalizedLineInput = lineStr ? lineStr.toUpperCase().trim() : '';
            
            // Try to find matching enum
            const foundLine = Object.values(CarLine).find(l => l === normalizedLineInput);
            if (foundLine) carLine = foundLine;
            else if (normalizedLineInput.includes('MERCEDES')) carLine = CarLine.MERCEDES;
            else if (normalizedLineInput.includes('VOLKS')) carLine = CarLine.VOLKSWAGEN;
            else if (normalizedLineInput.includes('CHEV')) carLine = CarLine.CHEVROLET;
            else if (normalizedLineInput.includes('HONDA')) carLine = CarLine.HONDA;

            // Safe number parsing (remove $, dots for thousands if European style, etc. but keep simple for now)
            // Assuming price is integer based on CSV sample provided: 44306
            const cleanPrice = priceStr ? Number(priceStr.replace(/[^0-9.]/g, '')) : 0;
            const cleanStock = stockStr ? Number(stockStr.replace(/[^0-9.]/g, '')) : 0;

            newProducts.push({
                code: code.trim(),
                name: name.trim(),
                line: carLine,
                details: details ? details.trim() : '',
                stock: cleanStock,
                price: cleanPrice,
                imageUrl: ''
            });
        });

        if (newProducts.length > 0) {
            await bulkAddProducts(newProducts);
            setBulkStatus({ 
                type: 'success', 
                msg: `¡Éxito! Se cargaron ${newProducts.length} productos. ${errors.length > 0 ? `(Filas omitidas: ${errors.length})` : ''}` 
            });
            setCsvText('');
        } else {
            setBulkStatus({ type: 'error', msg: 'No se encontraron productos válidos para importar.' });
        }

    } catch (e) {
        setBulkStatus({ type: 'error', msg: 'Error al conectar con Firebase o procesar datos.' });
        console.error(e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 overflow-hidden">
            
            {/* Header with Tabs */}
            <div className="p-6 border-b border-gray-700 bg-gray-900/50">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <PackagePlus size={24} className="text-jobu-red" />
                            Gestión de Catálogo
                        </h2>
                    </div>
                </div>

                <div className="flex p-1 space-x-1 bg-gray-700 rounded-xl">
                    <button
                        className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-200 ${mode === 'single' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        onClick={() => setMode('single')}
                    >
                        Carga Individual
                    </button>
                    <button
                        className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-200 ${mode === 'bulk' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        onClick={() => setMode('bulk')}
                    >
                        Importación Masiva (CSV)
                    </button>
                </div>
            </div>

            <div className="p-8">
                {mode === 'single' ? (
                    <form onSubmit={handleSingleSubmit} className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-bold text-gray-300 mb-1">Código *</label>
                                <input required name="code" value={form.code} onChange={handleSingleChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-jobu-blue outline-none" placeholder="Ej: 796D" />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-bold text-gray-300 mb-1">Línea *</label>
                                <select name="line" value={form.line} onChange={handleSingleChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-jobu-blue outline-none">
                                    {Object.values(CarLine).map(line => (
                                        <option key={line} value={line}>{line}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1">Nombre/Descripción *</label>
                            <input required name="name" value={form.name} onChange={handleSingleChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-jobu-blue outline-none" placeholder="Ej: Bisagra de Capot" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1">Detalles Técnicos</label>
                            <textarea name="details" value={form.details} onChange={handleSingleChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-jobu-blue outline-none" rows={3} placeholder="Ej: Pick up 61/66 derecha, material acero..." />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-1">Stock Inicial</label>
                                <input type="number" name="stock" value={form.stock} onChange={handleSingleChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-jobu-blue outline-none" min="0" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-1">Precio (Ref)</label>
                                <input type="number" name="price" value={form.price} onChange={handleSingleChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-jobu-blue outline-none" min="0" />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1">URL Imagen (Opcional)</label>
                            <input type="text" name="imageUrl" value={form.imageUrl} onChange={handleSingleChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-jobu-blue outline-none" placeholder="https://..." />
                        </div>

                        <button type="submit" className="w-full bg-jobu-red text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors shadow-md">
                            Guardar Producto
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                            <h4 className="font-bold text-blue-300 flex items-center gap-2 mb-2">
                                <Info size={18} /> Instrucciones de Formato
                            </h4>
                            <p className="text-sm text-blue-200 mb-2">
                                Copie y pegue sus datos desde su archivo. Se detecta automáticamente separador por punto y coma (;) o coma (,).
                            </p>
                            <code className="block bg-gray-900 p-3 rounded border border-blue-900/30 text-xs font-mono text-gray-400 whitespace-pre overflow-x-auto">
                                CÓDIGO;NOMBRE;LÍNEA;DETALLES;STOCK;PRECIO<br/>
                                796D;Bisagra Capot;FORD;PICK UP 61/ 66 derecha;0;44306<br/>
                                1001;Cierre Capot;FORD;Pick up 74/81;20;2200
                            </code>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Pegar datos CSV aquí:</label>
                            <textarea 
                                value={csvText}
                                onChange={(e) => setCsvText(e.target.value)}
                                className="w-full h-64 p-4 bg-gray-900 border border-gray-600 rounded-lg font-mono text-sm text-gray-200 focus:ring-2 focus:ring-jobu-blue outline-none"
                                placeholder={`CÓDIGO;NOMBRE;LÍNEA;DETALLES;STOCK;PRECIO\n796D;Bisagra Capot;FORD;PICK UP 61/ 66 derecha;0;44306`}
                            />
                        </div>

                        <button 
                            onClick={handleBulkSubmit}
                            disabled={bulkStatus.type === 'loading'}
                            className="w-full bg-jobu-blue text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {bulkStatus.type === 'loading' ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : <UploadCloud size={20} />}
                            Procesar Importación
                        </button>
                    </div>
                )}

                {/* Status Feedback */}
                {bulkStatus.type !== 'idle' && (
                    <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${
                        bulkStatus.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 
                        bulkStatus.type === 'error' ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-blue-900/30 text-blue-400 border border-blue-800'
                    }`}>
                        {bulkStatus.type === 'success' && <CheckCircle size={20} />}
                        {bulkStatus.type === 'error' && <AlertTriangle size={20} />}
                        <span className="font-medium">{bulkStatus.msg}</span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};