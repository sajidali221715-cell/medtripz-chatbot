"use client";

import { useState, useEffect, useRef } from 'react';
import SuggestionChips from './SuggestionChips';
import HealthcareCard, { HealthcareCardData } from './HealthcareCard';

type Message = {
  id: number;
  sender: 'user' | 'bot' | 'admin';
  content: string;
  lang?: 'en' | 'hi' | 'ar';
  cards?: HealthcareCardData[];
};

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'hi', label: 'Roman Hindi', flag: '🇮🇳' },
  { code: 'ar', label: 'Arabic', flag: '🇦🇪' }
] as const;

type LangCode = typeof LANGUAGES[number]['code'];

const INITIAL_SUGGESTIONS: Record<LangCode, string[]> = {
  en: ["👨⚕️ Find Doctor", "🏥 Hospitals", "📅 Book Appointment", "🧪 Lab Tests", "💄 Beauty Services", "📞 Contact Support"],
  hi: ["👨⚕️ Doctor Dhundho", "🏥 Hospital Dekho", "📅 Appointment Book Karo", "🧪 Lab Tests", "💄 Beauty Services", "📞 Support Se Baat Karein"],
  ar: ["👨⚕️ ابحث عن طبيب", "🏥 المستشفيات", "📅 حجز موعد", "🧪 فحوصات مخبرية", "💄 خدمات التجميل", "📞 اتصل بالدعم"]
};

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

const SESSION_ID = generateSessionId();

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<LangCode>('en');
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, sender: 'bot', content: 'Hello! Welcome to MedTripz. How may I assist you with your medical treatment journey in India today?', lang: 'en' }
  ]);
  const [input, setInput] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS['en']);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserAtBottom = useRef(true);

  // Poll for admin replies when the chat is open
  useEffect(() => {
    if (!isOpen || isSending) return; // Pause polling while AI is thinking
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, isSending]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isUserAtBottom.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  useEffect(() => {
    if (isUserAtBottom.current && scrollContainerRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, suggestions.length]);

  useEffect(() => {
    const hasUserMessages = messages.some(m => m.sender === 'user');
    if (!hasUserMessages) {
      setSuggestions(INITIAL_SUGGESTIONS[selectedLang]);
      const greetings: Record<LangCode, string> = {
        en: 'Hello! Welcome to MedTripz. How may I assist you with your medical treatment journey in India today?',
        hi: 'Namaste! MedTripz mein aapka swagat hai. Aaj hum aapki medical treatment journey mein kaise madad kar sakte hain?',
        ar: 'مرحباً! مرحبًا بكم في MedTripz. كيف يمكنني مساعدتكم في رحلة العلاج الطبي في الهند اليوم؟'
      };
      setMessages([{ id: 0, sender: 'bot', content: greetings[selectedLang], lang: selectedLang }]);
    }
  }, [selectedLang]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat?sessionId=${SESSION_ID}`);
      const data = await res.json();
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(prev => {
          const currentCount = prev.length;
          const dbCount = data.messages.length + 1;

          if (dbCount > currentCount || isManual) {
            return [
              prev[0] || { id: 0, sender: 'bot', content: 'Hello! Welcome to MedTripz.', lang: 'en' },
              ...data.messages
            ];
          }
          return prev;
        });

        if (typeof data.isManual === 'boolean') {
          setIsManual(data.isManual);
        }
        
        if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setSuggestions(prev => {
            if (JSON.stringify(data.suggestions) !== JSON.stringify(prev)) {
              return data.suggestions;
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.error('fetchMessages error:', e);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSuggestions([]);
    sendMessage(undefined, suggestion);
  };

  const sendMessage = async (e?: React.FormEvent, directMessage?: string) => {
    if (e) e.preventDefault();
    const messageToSend = directMessage || input.trim();
    if (!messageToSend || isSending) return;

    if (!directMessage) setInput('');
    setIsSending(true);
    setSuggestions([]);

    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', content: messageToSend, lang: selectedLang }]);

    try {
      // Add a 30-second timeout to the fetch call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: SESSION_ID, message: messageToSend, language: selectedLang }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.reply) {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          sender: 'bot', 
          content: data.reply, 
          lang: data.lang || selectedLang,
          cards: data.cards // Handle incoming healthcare cards
        }]);
      } else if (data.status === 'success' && isManual) {
        // In manual mode, the bot doesn't reply instantly
      } else {
        throw new Error(data.error || 'Empty response from AI');
      }
      
      if (data.suggestions?.length > 0) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions(INITIAL_SUGGESTIONS[selectedLang]);
      }

      if (typeof data.isManual === 'boolean') setIsManual(data.isManual);
      if (data.flagged) setIsFlagged(true);
    } catch (e: any) {
      console.error('sendMessage error:', e);
      const errorMsg = e.message || 'Technical Error. Please try again.';
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', content: `Error: ${errorMsg}`, lang: 'en' }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center text-2xl">💬</button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className={`p-4 text-white flex justify-between items-center transition-colors duration-300 ${isFlagged ? 'bg-red-600' : isManual ? 'bg-emerald-600' : 'bg-blue-600'}`}>
            <div>
              <h3 className="font-semibold text-sm">{isFlagged ? '⚠️ Escalated' : isManual ? '🛡️ Live Support' : '🤖 MedTripz AI'}</h3>
              <div className="flex gap-2 mt-1">
                {LANGUAGES.map(l => (
                  <button 
                    key={l.code} 
                    onClick={() => setSelectedLang(l.code)}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${selectedLang === l.code ? 'bg-white text-blue-600 border-white' : 'border-blue-400 opacity-70 hover:opacity-100'}`}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white text-xl font-bold">×</button>
          </div>

          {/* Messages */}
          <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={msg.id || i} className="flex flex-col gap-2">
                <div
                  dir={msg.lang === 'ar' ? 'rtl' : 'ltr'}
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-1 whitespace-pre-wrap ${
                    msg.sender === 'user' ? 'bg-blue-600 text-white self-end rounded-br-sm' : msg.sender === 'admin' ? 'bg-emerald-600 text-white self-start rounded-bl-sm' : 'bg-white text-gray-800 self-start rounded-bl-sm shadow-sm border border-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
                
                {/* Render Healthcare Cards if present */}
                {msg.cards && msg.cards.length > 0 && (
                  <div className={`flex flex-col gap-3 mt-1 ${msg.lang === 'ar' ? 'items-end' : 'items-start'}`}>
                    {msg.cards.map((card, idx) => (
                      <HealthcareCard key={idx} card={card} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isSending && (
              <div className="max-w-[82%] px-4 py-3 rounded-2xl bg-white self-start border border-gray-100 shadow-sm">
                <span className="flex gap-1 animate-pulse"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {!isFlagged && !isSending && suggestions.length > 0 && (
            <div className="bg-gray-50 pb-3" dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}>
              <SuggestionChips suggestions={suggestions} onSuggestionClick={handleSuggestionClick} loading={isSending} />
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input
              type="text"
              dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isFlagged ? 'Support is on the way...' : selectedLang === 'ar' ? 'اكتب رسالتك هنا...' : selectedLang === 'hi' ? 'Apna message likhein...' : 'Type your message...'}
              disabled={isSending || isFlagged}
              className="flex-1 p-2.5 border border-gray-200 rounded-full px-4 focus:outline-none focus:border-blue-500 text-black text-sm bg-white"
            />
            <button type="submit" disabled={isSending || !input.trim() || isFlagged} className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all">➤</button>
          </form>
        </div>
      )}
    </div>
  );
}
