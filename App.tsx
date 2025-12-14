import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HelpChat } from './components/HelpChat';
import { Inventory } from './pages/Inventory';
import { StockEntry } from './pages/StockEntry';
import { NewProduct } from './pages/NewProduct';
import { Orders } from './pages/Orders';
import { PriceLists } from './pages/PriceLists';
import { ExportPriceLists } from './pages/ExportPriceLists';

function App() {
  return (
    <HashRouter>
      <div className="flex min-h-screen bg-gray-900 text-white">
        <Navbar />
        <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen relative">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Inventory />} />
              <Route path="/ingreso" element={<StockEntry />} />
              <Route path="/nuevo-producto" element={<NewProduct />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route path="/precios" element={<PriceLists />} />
              <Route path="/exportacion" element={<ExportPriceLists />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          
          {/* AI Assistant available on all pages */}
          <HelpChat />
        </main>
      </div>
    </HashRouter>
  );
}

export default App;