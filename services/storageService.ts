import { db } from '../firebaseConfig';
import { 
  collection, getDocs, addDoc, updateDoc, doc, query, 
  increment, writeBatch 
} from 'firebase/firestore';
import { Product, Order, CarLine } from '../types';

// ==========================================
// Constants & Config
// ==========================================

const COLLECTIONS = {
  PRODUCTS: 'productos',
  ORDERS: 'movimientos'
} as const;

const BATCH_SIZE_LIMIT = 450; // Firestore limit is 500

// Helper to check environment mode
const isDemoMode = (): boolean => {
    return false; // Force production mode
};

// ==========================================
// PRODUCT Services
// ==========================================

/**
 * Fetches all products from Firestore.
 * Falls back to local storage/mock data if connection fails.
 */
export const getProducts = async (): Promise<Product[]> => {
  if (isDemoMode()) return getMockProducts();

  try {
    const q = query(collection(db, COLLECTIONS.PRODUCTS));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.warn("[Storage] Firebase connection failed, falling back to local storage.", error);
    return getMockProducts();
  }
};

/**
 * Adds a single product to the database.
 */
export const addProduct = async (product: Omit<Product, 'id'>): Promise<void> => {
  if (isDemoMode()) {
    addToMockProducts(product);
    return;
  }
  await addDoc(collection(db, COLLECTIONS.PRODUCTS), product);
};

/**
 * Updates specific fields of a product.
 */
export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<void> => {
  if (isDemoMode()) {
    updateMockProduct(productId, updates);
    return;
  }

  // Clean undefined values to prevent Firestore errors
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );

  const ref = doc(db, COLLECTIONS.PRODUCTS, productId);
  await updateDoc(ref, cleanUpdates);
};

/**
 * Performs a bulk upload of products using Firestore Batches.
 * Handles pagination for batches larger than 500 items.
 */
export const bulkAddProducts = async (products: Omit<Product, 'id'>[]): Promise<string> => {
    if (isDemoMode()) return "Modo demo no soporta carga masiva";
    
    let batch = writeBatch(db);
    let count = 0;
    let totalBatches = 0;

    for (const product of products) {
        const ref = doc(collection(db, COLLECTIONS.PRODUCTS));
        batch.set(ref, product);
        count++;

        if (count >= BATCH_SIZE_LIMIT) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
            totalBatches++;
        }
    }

    if (count > 0) {
        await batch.commit();
    }

    return `Se cargaron ${products.length} productos correctamente.`;
};

/**
 * Updates the stock quantity of a specific product atomically.
 */
export const updateStock = async (productId: string, quantityToAdd: number): Promise<void> => {
  if (isDemoMode()) {
    updateMockStock(productId, quantityToAdd);
    return;
  }
  const ref = doc(db, COLLECTIONS.PRODUCTS, productId);
  await updateDoc(ref, { stock: increment(quantityToAdd) });
};

/**
 * Updates the base price of all products (or filtered by brand).
 * CAUTION: This performs a permanent database write.
 */
export const updateGlobalPrices = async (percentage: number, targetBrands: string[]): Promise<string> => {
    if (percentage === 0) return "El porcentaje es 0, no se realizaron cambios.";
    if (isDemoMode()) return "Modo demo no soporta actualizaciones masivas de precio.";

    // 1. Fetch products
    const allProducts = await getProducts();
    const productsToUpdate = targetBrands.length > 0 
        ? allProducts.filter(p => targetBrands.includes(p.line))
        : allProducts;

    if (productsToUpdate.length === 0) return "No hay productos que coincidan con el filtro.";

    // 2. Batch Update
    let batch = writeBatch(db);
    let count = 0;
    let totalUpdated = 0;

    for (const product of productsToUpdate) {
        if (product.price === undefined) continue;

        const currentPrice = product.price;
        const newPrice = Math.round(currentPrice * (1 + (percentage / 100)));
        
        const ref = doc(db, COLLECTIONS.PRODUCTS, product.id);
        batch.update(ref, { price: newPrice });
        
        count++;
        totalUpdated++;

        if (count >= BATCH_SIZE_LIMIT) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
    }

    return `Se actualizaron ${totalUpdated} precios correctamente (Ajuste: ${percentage}%).`;
};

// ==========================================
// ORDER Services
// ==========================================

/**
 * Creates a new order and atomically decrements stock for purchased items.
 */
export const createOrder = async (order: Omit<Order, 'id'>): Promise<string> => {
  if (isDemoMode()) return createMockOrder(order);

  const batch = writeBatch(db);
  
  // 1. Create Order Record
  const orderRef = doc(collection(db, COLLECTIONS.ORDERS));
  batch.set(orderRef, order);

  // 2. Decrement Stock for each item
  order.items.forEach(item => {
    const productRef = doc(db, COLLECTIONS.PRODUCTS, item.id);
    batch.update(productRef, { stock: increment(-item.quantity) });
  });

  await batch.commit();
  return orderRef.id;
};

// ==========================================
// MOCK DATA & FALLBACKS (Private)
// ==========================================

const MOCK_PRODUCTS: Product[] = [
  { id: '1', code: '796D', name: 'Bisagra Capot', line: CarLine.FORD, details: 'Pick up 61/66 derecha', stock: 50, price: 1500 },
  { id: '2', code: '797I', name: 'Bisagra Capot', line: CarLine.FORD, details: 'Pick up 61/66 izquierda', stock: 45, price: 1500 },
  { id: '3', code: '1001', name: 'Cierre de Capot', line: CarLine.FORD, details: 'Pick up 74/81', stock: 20, price: 2200 },
  { id: '4', code: '810D', name: 'Bisagra Capot', line: CarLine.CHEVROLET, details: 'Pick up 60/66 derecha', stock: 12, price: 1800 },
  { id: '5', code: 'FI508', name: 'Rienda Puerta', line: CarLine.FIAT, details: 'Ducato/Boxer 96/03', stock: 100, price: 950 },
];

// Helper functions for LocalStorage Mocking
const getMockProducts = (): Product[] => {
    const stored = localStorage.getItem(COLLECTIONS.PRODUCTS);
    if (!stored) {
        localStorage.setItem(COLLECTIONS.PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
        return MOCK_PRODUCTS;
    }
    return JSON.parse(stored);
};

const addToMockProducts = (product: Omit<Product, 'id'>) => {
    const products = getMockProducts();
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
    localStorage.setItem(COLLECTIONS.PRODUCTS, JSON.stringify([...products, newProduct]));
};

const updateMockProduct = (id: string, updates: Partial<Product>) => {
    const products = getMockProducts();
    const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
    localStorage.setItem(COLLECTIONS.PRODUCTS, JSON.stringify(updated));
};

const updateMockStock = (id: string, qty: number) => {
    const products = getMockProducts();
    const updated = products.map(p => p.id === id ? { ...p, stock: p.stock + qty } : p);
    localStorage.setItem(COLLECTIONS.PRODUCTS, JSON.stringify(updated));
};

const createMockOrder = (order: Omit<Order, 'id'>): string => {
    const products = getMockProducts();
    order.items.forEach(item => {
        const idx = products.findIndex(p => p.id === item.id);
        if(idx > -1) products[idx].stock -= item.quantity;
    });
    localStorage.setItem(COLLECTIONS.PRODUCTS, JSON.stringify(products));
    
    const storedOrders = JSON.parse(localStorage.getItem(COLLECTIONS.ORDERS) || '[]');
    const newOrder = { ...order, id: Math.random().toString(36).substr(2, 9) };
    localStorage.setItem(COLLECTIONS.ORDERS, JSON.stringify([...storedOrders, newOrder]));
    return newOrder.id;
};
