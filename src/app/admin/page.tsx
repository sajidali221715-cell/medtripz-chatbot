"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';


type Message = {
  id: number;
  sender: 'user' | 'bot' | 'admin';
  content: string;
  createdAt: string;
};

type Session = {
  id: number;
  sessionId: string;
  isManual: boolean;
  updatedAt: string;
};

export default function AdminDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isManual, setIsManual] = useState(false);
  const [input, setInput] = useState('');
  const [toggling, setToggling] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll sessions list
  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 4000);
    return () => clearInterval(interval);
  }, []);

  // Poll messages for active session
  useEffect(() => {
    if (activeSession === null) return;
    fetchMessages(activeSession);
    const interval = setInterval(() => fetchMessages(activeSession), 3000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/admin/sessions');
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/sessions/${id}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        setIsManual(data.isManual);
      }
    } catch (e) { console.error(e); }
  };

  // Toggle Admin Active / Inactive for this session
  const toggleMode = async () => {
    if (activeSession === null) return;
    setToggling(true);
    try {
      await fetch(`/api/admin/sessions/${activeSession}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleMode' }),
      });
      await fetchMessages(activeSession);
      fetchSessions();
    } catch (e) { console.error(e); }
    finally { setToggling(false); }
  };

  // Admin sends a manual reply
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || activeSession === null || !isManual) return;
    setSending(true);
    try {
      await fetch(`/api/admin/sessions/${activeSession}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendMessage', message: input }),
      });
      setInput('');
      await fetchMessages(activeSession);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  // ── Helpers ────────────────────────────────────────────────
  const senderMeta: Record<Message['sender'], { label: string; bubble: string; side: string }> = {
    user:  { label: '👤 User',     bubble: 'bg-blue-600 text-white',    side: 'items-start' },
    bot:   { label: '🤖 AI',       bubble: 'bg-slate-600 text-white',   side: 'items-start' },
    admin: { label: '🛡️ Admin (You)', bubble: 'bg-emerald-600 text-white', side: 'items-end'   },
  };

  const fmt = (iso: string) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="flex h-screen bg-slate-900 font-sans text-white overflow-hidden">

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className="w-72 bg-slate-800 flex flex-col border-r border-slate-700 shrink-0">

        {/* Brand */}
        <div className="px-5 py-4 border-b border-slate-700">
          <h1 className="font-bold text-lg tracking-wide">🏥 Medtripz Admin</h1>
          <p className="text-xs text-slate-400 mt-0.5">Live Chat Dashboard</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-xs font-semibold uppercase text-slate-500 px-4 py-3 tracking-wider">
            Sessions ({sessions.length})
          </p>

          {sessions.length === 0 && (
            <p className="text-sm text-slate-500 text-center mt-8 px-4">
              No active chats yet.<br />Share the chat widget link with users.
            </p>
          )}

          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSession(s.id)}
              className={`w-full text-left px-4 py-3 border-b border-slate-700 hover:bg-slate-700 transition-colors ${
                activeSession === s.id ? 'bg-slate-700 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-white truncate">
                    #{s.sessionId.substring(0, 10)}…
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmt(s.updatedAt)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  s.isManual ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-600 text-slate-300'
                }`}>
                  {s.isManual ? 'Admin' : 'AI'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ═══════════════ MAIN PANEL ═══════════════ */}
      <main className="flex-1 flex flex-col min-w-0">

        {activeSession === null ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
            <span className="text-6xl">💬</span>
            <p className="text-xl font-medium text-slate-400">Select a session</p>
            <p className="text-sm">Pick a chat from the sidebar to view messages and take over.</p>
          </div>
        ) : (
          <>
            {/* ── TOP BAR ── */}
            <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between gap-4 shrink-0">
              <div>
                <p className="font-bold text-base">Session #{activeSession}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isManual
                    ? '🟢 Admin Active — you are handling this conversation'
                    : '🤖 AI Active — AI is replying to the user automatically'}
                </p>
              </div>

              {/* ── TOGGLE BUTTON ── */}
              <button
                onClick={toggleMode}
                disabled={toggling}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shrink-0 ${
                  isManual
                    ? 'bg-slate-600 hover:bg-slate-500 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isManual ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                {toggling
                  ? 'Switching…'
                  : isManual
                    ? 'Admin Active — Click to Hand Back to AI'
                    : 'Admin Inactive — Click to Take Over'}
              </button>
            </div>

            {/* ── MESSAGES ── */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-900 flex flex-col gap-4">
              {messages.length === 0 && (
                <p className="text-center text-slate-500 mt-16 text-sm">
                  No messages yet in this session.
                </p>
              )}

              {messages.map((msg, i) => {
                const meta = senderMeta[msg.sender];
                return (
                  <div key={msg.id || i} className={`flex flex-col max-w-[65%] ${meta.side}`}>
                    <span className="text-xs text-slate-500 mb-1 px-1">
                      {meta.label} {msg.createdAt && `• ${fmt(msg.createdAt)}`}
                    </span>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${meta.bubble}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* ── INPUT BAR ── */}
            <form
              onSubmit={sendMessage}
              className="p-4 bg-slate-800 border-t border-slate-700 flex gap-3 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  isManual
                    ? 'Type your reply as admin…'
                    : 'Toggle yourself Active above to reply manually'
                }
                disabled={!isManual}
                className="flex-1 p-3 bg-slate-700 border border-slate-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!isManual || !input.trim() || sending}
                className="px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm shrink-0"
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
