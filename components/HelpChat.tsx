import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, Sparkles } from 'lucide-react';
import { sendMessageToGemini, getPageContext } from '../services/aiService';

// Internal Type Definition
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

/**
 * Floating Chat Widget component.
 * Context-aware: Changes suggestions based on the current route.
 */
export const HelpChat: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // 1. Update suggestions when route changes
  useEffect(() => {
    const context = getPageContext(location.pathname);
    setSuggestions(context.suggestions);
    
    // Notify user if chat is open during navigation
    if (messages.length > 0 && isOpen) {
        const navMessage: Message = { 
            id: Date.now().toString(), 
            text: `Cambiaste de pantalla. ¿En qué te ayudo aquí?`, 
            sender: 'ai' 
        };
        setMessages(prev => [...prev, navMessage]);
    }
  }, [location.pathname]);

  // 2. Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, loading]);

  // --- Handlers ---

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add User Message
    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Call AI Service
    const response = await sendMessageToGemini(text, location.pathname);
    
    // Add AI Response
    const aiMsg: Message = { id: (Date.now() + 1).toString(), text: response || 'Error', sender: 'ai' };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  return (
    <>
      {/* 
        ========================================
        Trigger Button (Floating Action Button)
        ========================================
      */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[100] p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center group ${
            isOpen ? 'bg-red-600 rotate-90' : 'bg-jobu-blue hover:bg-blue-600'
        }`}
      >
        {isOpen ? <X className="text-white" /> : <MessageCircle className="text-white" />}
        
        {!isOpen && (
            <span className="absolute right-full mr-3 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-700">
                ¿Necesitas ayuda?
            </span>
        )}
      </button>

      {/* 
        ========================================
        Chat Window Panel
        ========================================
      */}
      <div className={`fixed bottom-24 right-6 w-80 md:w-96 h-[500px] max-h-[80vh] bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl z-[100] flex flex-col transition-all duration-300 transform origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'
      }`}>
        
        {/* Header */}
        <div className="p-4 bg-jobu-blue rounded-t-2xl flex items-center gap-3 border-b border-blue-800">
            <div className="bg-white/20 p-2 rounded-full">
                <Bot className="text-white" size={20} />
            </div>
            <div>
                <h3 className="font-bold text-white text-sm">Asistente Jobuzetti</h3>
                <p className="text-xs text-blue-200 flex items-center gap-1">
                    <Sparkles size={10} /> IA Activa • Gemini Flash
                </p>
            </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600">
            {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-10 animate-fade-in">
                    <Bot size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Hola, soy tu asistente.</p>
                    <p className="text-xs mt-1">Estoy configurado para ayudarte en esta sección.</p>
                </div>
            )}

            {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.sender === 'user' 
                        ? 'bg-jobu-blue text-white rounded-br-none' 
                        : 'bg-gray-700 text-gray-200 rounded-bl-none border border-gray-600'
                    }`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-gray-700 p-3 rounded-2xl rounded-bl-none border border-gray-600 flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {suggestions.length > 0 && messages.length < 2 && (
            <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
                {suggestions.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="whitespace-nowrap bg-gray-700 hover:bg-gray-600 border border-gray-600 text-xs text-blue-300 px-3 py-1.5 rounded-full transition-colors"
                    >
                        {s}
                    </button>
                ))}
            </div>
        )}

        {/* Input Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900/50 rounded-b-2xl">
            <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                className="flex gap-2"
            >
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu duda..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-jobu-blue outline-none"
                />
                <button 
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="bg-jobu-blue text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
      </div>
    </>
  );
};
