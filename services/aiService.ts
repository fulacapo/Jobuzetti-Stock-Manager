import { GoogleGenAI } from "@google/genai";

// ==========================================
// Configuration
// ==========================================

// NOTE: This key is specifically authorized for the Chat Service.
const API_KEY = "AIzaSyDCDSSXScBLOlfYBXGyGRZsYA-GFo8OGLU";
const MODEL_NAME = 'gemini-2.5-flash';

// ==========================================
// Context Definitions
// ==========================================

interface PageContext {
  role: string;
  suggestions: string[];
}

const DEFAULT_CONTEXT: PageContext = {
  role: "Eres un asistente útil para la aplicación de gestión de stock Jobuzetti. Ayuda al usuario a navegar por la app.",
  suggestions: ["¿Qué puedo hacer en esta app?", "¿Cómo voy al inventario?"]
};

const PAGE_CONTEXTS: Record<string, PageContext> = {
  '/': {
    role: "Estás en la pantalla de 'Inventario General'. Tu objetivo es ayudar al usuario a buscar productos, filtrar por línea (marca) y ordenar la grilla. Explica que pueden usar la barra de búsqueda o los desplegables. Si preguntan por stock, diles que los colores indican la disponibilidad.",
    suggestions: [
      "¿Cómo busco un producto específico?",
      "¿Qué significan los colores del stock?",
      "¿Cómo filtro solo los de FORD?",
      "¿Cómo ordeno por precio?"
    ]
  },
  '/ingreso': {
    role: "Estás en la pantalla de 'Ingreso de Stock'. Ayuda al usuario a sumar cantidades al inventario existente. Explica que deben escribir el código, seleccionar la sugerencia y luego poner la cantidad a sumar.",
    suggestions: [
      "¿Cómo cargo stock a un producto?",
      "No encuentro el código, ¿qué hago?",
      "¿Puedo restar stock desde acá?",
      "¿Se guarda automático?"
    ]
  },
  '/nuevo-producto': {
    role: "Estás en la pantalla de 'Nuevo Producto'. Ayuda al usuario a crear items individuales o usar la carga masiva CSV. Explica el formato del CSV si preguntan (CÓDIGO;NOMBRE;...).",
    suggestions: [
      "¿Cómo cargo un producto nuevo?",
      "¿Cuál es el formato para carga masiva?",
      "¿Qué hago si el producto ya existe?",
      "¿Cómo subo la imagen?"
    ]
  },
  '/pedidos': {
    role: "Estás en la pantalla de 'Pedidos / Remito'. Ayuda al usuario a armar un carrito para un cliente. Explica cómo buscar productos a la izquierda, agregarlos y luego poner el nombre del cliente para generar el PDF.",
    suggestions: [
      "¿Cómo armo un pedido?",
      "¿Cómo elimino un item del carrito?",
      "¿El PDF descuenta stock?",
      "¿Dónde pongo el nombre del cliente?"
    ]
  },
  '/precios': {
    role: "Estás en la pantalla de 'Lista de Precios'. Ayuda a configurar aumentos, filtrar marcas y editar precios. Explica con cuidado la función de 'Actualizar BD' (Base de datos) vs el ajuste temporal.",
    suggestions: [
      "¿Cómo aplico un aumento del 10%?",
      "¿Cómo edito un precio individual?",
      "¿Cómo genero el PDF?",
      "¿Qué hace el botón rojo de Actualizar BD?"
    ]
  },
  '/exportacion': {
    role: "Estás en la pantalla de 'Lista de Exportación (USD)'. Ayuda con los precios en dólares y la traducción al inglés. Explica que la traducción es automática pero editable.",
    suggestions: [
      "¿Cómo cambio el precio a Dólares?",
      "¿Cómo corrijo la traducción?",
      "¿Cómo genero la lista en Inglés?",
      "¿Cómo filtro por marca?"
    ]
  }
};

// ==========================================
// Service Implementation
// ==========================================

let aiClient: GoogleGenAI | null = null;

const initializeClient = () => {
  if (!aiClient && API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiClient;
};

export const getPageContext = (path: string): PageContext => {
  return PAGE_CONTEXTS[path] || DEFAULT_CONTEXT;
};

/**
 * Sends a message to the Gemini API with context-aware system instructions.
 */
export const sendMessageToGemini = async (message: string, path: string): Promise<string> => {
  const ai = initializeClient();

  if (!ai) {
    return "⚠️ Configuración incompleta: No se detectó la API Key de Gemini. Por favor, revisa el código.";
  }

  const context = getPageContext(path);
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: message,
      config: {
        systemInstruction: `Eres el Asistente Virtual de Jobuzetti Stock Manager. Responde de forma breve, concisa y en español. ${context.role}`,
        temperature: 0.7,
      }
    });
    return response.text || "No se recibió respuesta del modelo.";
  } catch (error: any) {
    console.error("Error calling Gemini:", error);
    
    // Auth Error Handling
    if (
        error.message?.includes("401") || 
        error.message?.includes("API keys are not supported") || 
        error.message?.includes("UNAUTHENTICATED") || 
        error.message?.includes("CREDENTIALS_MISSING")
    ) {
        return "⚠️ Error de Autenticación: La API Key configurada no es válida o ha expirado.";
    }

    return "Lo siento, ocurrió un error técnico al procesar tu consulta. Por favor intenta nuevamente.";
  }
};
