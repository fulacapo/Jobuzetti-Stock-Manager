import React, { useState, useEffect } from 'react';
import { getProducts, createOrder } from '../services/storageService';
import { Product, CartItem } from '../types';
import { Search, ShoppingCart, Trash2, FileText, Plus, Minus } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { JOBUZETTI_LOGO_URL } from '../assets';

export const Orders: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock) return prev; // Prevent overselling
            return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
        if (item.id === id) {
            const newQty = Math.max(1, item.quantity + delta);
            return newQty <= item.stock ? { ...item, quantity: newQty } : item;
        }
        return item;
    }));
  };

  const generatePDF = (orderId: string) => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    // Header Background
    doc.setFillColor(0, 85, 143); // Jobu Blue
    doc.rect(0, 0, 210, 40, 'F');

    // Title Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("JOBUZETTI S.A.", 14, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Autopartes - Bisagras y Cierre de Capot", 14, 28);

    doc.text("REMITO DE ENTREGA", 150, 20);
    doc.text(`Fecha: ${today}`, 150, 28);
    doc.text(`Ref: ${orderId.toUpperCase().slice(0, 8)}`, 150, 36);

    // Customer Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Cliente: ${customerName}`, 14, 55);

    // Table
    const tableColumn = ["Código", "Descripción", "Línea", "Cant", "Precio Unit.", "Subtotal"];
    const tableRows: any[] = [];

    let totalAmount = 0;

    cart.forEach(item => {
      const price = item.price || 0;
      const subtotal = price * item.quantity;
      totalAmount += subtotal;
      
      const itemData = [
        item.code,
        `${item.name} - ${item.details}`,
        item.line,
        item.quantity,
        `$${price}`,
        `$${subtotal}`
      ];
      tableRows.push(itemData);
    });

    // Total Row
    tableRows.push(['', '', '', '', 'TOTAL', `$${totalAmount}`]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      theme: 'grid',
      headStyles: { fillColor: [227, 6, 19] }, // Jobu Red
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
          0: { cellWidth: 25, fontStyle: 'bold' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30 },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' }
      }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Gracias por su confianza.", 14, finalY + 20);
    doc.text("Firma de Conformidad: __________________________", 110, finalY + 20);

    doc.save(`Remito_Jobuzetti_${orderId}.pdf`);
  };

  const handleCheckout = async () => {
    if (!customerName || cart.length === 0) {
        alert("Ingrese nombre de cliente y agregue productos.");
        return;
    }

    try {
        const orderId = await createOrder({
            customerName,
            date: new Date(),
            items: cart,
            totalItems: cart.reduce((acc, item) => acc + item.quantity, 0),
            status: 'completed'
        });
        
        generatePDF(orderId);
        
        // Reset
        setCart([]);
        setCustomerName('');
        // Refresh products to show new stock
        getProducts().then(setProducts);
        alert("Pedido procesado correctamente.");
    } catch (e) {
        alert("Error al procesar el pedido.");
        console.error(e);
    }
  };

  // Filter search for adding items
  const searchResults = products.filter(p => 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase())) 
    && p.stock > 0
  ).slice(0, 5);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-2rem)]">
      {/* LEFT: Product Selector */}
      <div className="flex-1 flex flex-col bg-gray-800 rounded-2xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700 bg-gray-900/50">
            <h2 className="text-xl font-bold text-white">Selector de Productos</h2>
            <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text"
                    placeholder="Buscar para agregar al pedido..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-jobu-blue outline-none text-white placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {searchTerm && searchResults.map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 border border-gray-700 bg-gray-700/30 rounded-xl hover:bg-gray-700 transition-colors">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-jobu-blue">{product.code}</span>
                            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">{product.line}</span>
                        </div>
                        <h4 className="font-medium text-white">{product.name}</h4>
                        <p className="text-sm text-gray-400">{product.details}</p>
                        <p className="text-xs text-green-400 mt-1">Stock: {product.stock}</p>
                    </div>
                    <button 
                        onClick={() => addToCart(product)}
                        className="bg-gray-800 border border-gray-600 text-jobu-blue p-2 rounded-lg hover:bg-jobu-blue hover:text-white transition-all"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            ))}
            {!searchTerm && (
                <div className="text-center text-gray-600 mt-10">
                    <Search size={40} className="mx-auto mb-2 opacity-20" />
                    <p>Use el buscador para añadir items</p>
                </div>
            )}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout */}
      <div className="w-full lg:w-[450px] bg-gray-800 rounded-2xl shadow-xl border border-gray-700 flex flex-col overflow-hidden">
        <div className="p-6 bg-jobu-blue text-white">
            <div className="flex items-center gap-3 mb-4">
                <ShoppingCart />
                <h2 className="text-xl font-bold">Detalle del Pedido</h2>
            </div>
            <input 
                type="text"
                placeholder="Nombre del Cliente / Razón Social"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200 focus:bg-white/20 outline-none"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
            />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-800">
            {cart.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    <p>El carrito está vacío.</p>
                </div>
            ) : (
                cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                         <div className="flex-1">
                            <p className="font-bold text-sm text-white">{item.code}</p>
                            <p className="text-xs text-gray-400 truncate">{item.name}</p>
                         </div>
                         
                         <div className="flex items-center bg-gray-600 rounded border border-gray-500">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-500 text-white"><Minus size={14}/></button>
                            <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-500 text-white"><Plus size={14}/></button>
                         </div>

                         <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 size={18} />
                         </button>
                    </div>
                ))
            )}
        </div>

        <div className="p-6 bg-gray-900 border-t border-gray-800">
            <div className="flex justify-between items-center mb-4 text-lg font-bold text-white">
                <span>Total Items:</span>
                <span>{cart.reduce((a, b) => a + b.quantity, 0)}</span>
            </div>
            <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || !customerName}
                className="w-full bg-jobu-red text-white py-4 rounded-xl font-bold shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
            >
                <FileText size={20} />
                Confirmar y Generar PDF
            </button>
        </div>
      </div>
    </div>
  );
};