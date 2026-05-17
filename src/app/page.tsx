import ChatWidget from './components/ChatWidget';

export const metadata = {
  title: 'MedTripz – Medical Tourism Assistance',
  description: 'AI-powered medical tourism assistance. Chat with our expert team for treatment guidance in India.',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white font-sans">

      {/* ── NAV ───────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏥</span>
          <span className="font-bold text-lg tracking-tight">MedTripz</span>
          <span className="hidden sm:inline text-xs text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-700">
            Live Chat
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Online Support
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-blue-300 bg-blue-900/40 border border-blue-700 px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          AI-Powered Medical Tourism Assistance
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-5 bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
          Your Medical Journey,<br />Starts Here
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10">
          Get instant assistance for medical treatments in India — treatment info, cost estimates, hospital guidance, and more.
        </p>

        {/* ── Feature cards ── */}
        <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:bg-white/10 transition-colors">
            <div className="text-3xl mb-3">🤖</div>
            <h2 className="font-bold text-sm mb-2">Instant AI Support</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              24/7 AI assistance for all your medical tourism queries.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:bg-white/10 transition-colors">
            <div className="text-3xl mb-3">🏨</div>
            <h2 className="font-bold text-sm mb-2">Top Hospitals</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect with leading hospitals and specialists across India.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:bg-white/10 transition-colors">
            <div className="text-3xl mb-3">🌍</div>
            <h2 className="font-bold text-sm mb-2">International Patients</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Serving patients from Middle East, Africa, CIS & SAARC regions.
            </p>
          </div>
        </div>
      </section>

      {/* ── CHAT WIDGET (bottom-right) ─────────────────────── */}
      <ChatWidget />
    </main>
  );
}
