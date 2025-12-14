// ==========================================
// Jobuzetti Core Type Definitions
// ==========================================

// --- Enums ---
export enum CarLine {
  FORD = 'FORD',
  CHEVROLET = 'CHEVROLET',
  DODGE = 'DODGE',
  MERCEDES = 'MERCEDES BENZ',
  FIAT = 'FIAT',
  VOLKSWAGEN = 'VOLKSWAGEN',
  PEUGEOT = 'PEUGEOT',
  CITROEN = 'CITROEN',
  TOYOTA = 'TOYOTA',
  RENAULT = 'RENAULT',
  HONDA = 'HONDA',
  UNIVERSAL = 'UNIVERSAL'
}

export type OrderStatus = 'completed' | 'pending';

// --- Interfaces ---

/**
 * Representa un producto en el inventario.
 */
export interface Product {
  id: string;
  code: string;       // Código del producto (ej: 796D)
  name: string;       // Descripción (ej: Bisagra de Capot)
  line: CarLine;      // Marca o línea automotriz
  details: string;    // Detalles técnicos (ej: 61/66 derecha)
  stock: number;      // Cantidad física disponible
  price?: number;     // Precio en Pesos (ARS)
  imageUrl?: string;  // URL de la imagen del producto
  
  // Campos específicos para exportación
  priceUsd?: number;  // Precio en Dólares
  detailsEn?: string; // Detalles traducidos al Inglés
}

/**
 * Extiende Product para su uso en el carrito de compras.
 */
export interface CartItem extends Product {
  quantity: number;
}

/**
 * Representa un pedido o movimiento de stock confirmado.
 */
export interface Order {
  id: string;
  customerName: string;
  date: Date;
  items: CartItem[];
  totalItems: number;
  status: OrderStatus;
}
