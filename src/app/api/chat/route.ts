import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// ── Optimized Abusive Language Detection ──────────────────────────────────
const ABUSIVE_WORDS = [
  'fuck', 'fucker', 'fucking', 'shit', 'bastard', 'bitch', 'asshole',
  'retard', 'cunt', 'piss', 'moron', 'jerk', 'madarchod', 'behenchod', 
  'chutiya', 'gaand', 'bhosdike', 'bhosdika', 'harami', 'kamina', 'randi', 
  'bhosda', 'lund', 'lavda', 'maderchod',
];

function isAbusive(text: string): boolean {
  const lowerText = text.toLowerCase();
  return ABUSIVE_WORDS.some(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(lowerText)
  );
}

// ── Improved Response Cleaning ───────────────────────────────────────────
function cleanResponse(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')           // Remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1')     // Remove bold
    .replace(/\*(.+?)\*/g, '$1')         // Remove italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '')  // Remove code
    .replace(/^\s*[-•*]\s+/gm, '• ')    // Normalize bullets
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove markdown links
    .replace(/\n{3,}/g, '\n\n')         // Max 2 consecutive newlines
    .trim();
}

// ── Smart Navigation Cards ───────────────────────────────────────────────
function getCards(message: string, lang: 'en' | 'hi' | 'ar'): any[] {
  const msg = message.toLowerCase();
  const cards: any[] = [];

  if (msg.includes('doctor') || msg.includes('specialist') || msg.includes('طبيب')) {
    cards.push({
      type: 'doctor',
      name: lang === 'ar' ? 'د. أرون كومار' : 'Dr Arun Kumar',
      speciality: lang === 'ar' ? 'أخصائي أمراض القلب' : 'Cardiologist',
      hospital: lang === 'ar' ? 'مستشفى أليانز' : 'Alliance Hospital',
      city: lang === 'ar' ? 'مومباي' : 'Mumbai',
      experience: lang === 'ar' ? '15+ سنة' : '15+ Years',
      slug: 'dr-arun-kumar',
      profileUrl: '/doctors/dr-arun-kumar',
      appointmentUrl: '/book-appointment/dr-arun-kumar'
    });
  }

  if (msg.includes('hospital') || msg.includes('clinic') || msg.includes('مستشفى')) {
    cards.push({
      type: 'hospital',
      name: lang === 'ar' ? 'مستشفى أبولو' : 'Apollo Indraprastha',
      speciality: lang === 'ar' ? 'رعاية متعددة التخصصات' : 'Multi-Specialty Care',
      city: lang === 'ar' ? 'نيودلهي' : 'New Delhi',
      slug: 'apollo-delhi',
      profileUrl: '/hospitals/apollo-delhi',
      appointmentUrl: '/book-appointment/apollo-delhi'
    });
  }

  if (msg.includes('test') || msg.includes('lab') || msg.includes('فحص')) {
    cards.push({
      type: 'lab',
      name: lang === 'ar' ? 'فحص كامل للجسم' : 'Full Body Checkup',
      speciality: lang === 'ar' ? 'التشخيص المتقدم' : 'Advanced Diagnostics',
      city: lang === 'ar' ? 'متاح في جميع المدن' : 'Available in all cities',
      slug: 'full-body-checkup',
      profileUrl: '/lab-tests/full-body-checkup',
      appointmentUrl: '/book-appointment/full-body-checkup'
    });
  }

  return cards.slice(0, 2); 
}

// ── Multilingual Suggestions ─────────────────────────────────────────────
const SUGGESTIONS: Record<string, Record<string, string[]>> = {
  en: {
    default: ["👨⚕️ Find Doctor", "🏥 Hospitals", "📅 Book Appointment"],
    doctor: ["👨⚕️ Top Specialists", "🏥 Find Hospitals", "📅 Book Appointment"],
    cost: ["📄 Share Reports", "💰 Treatment Cost", "🏦 Payment Options"],
    appointment: ["👨⚕️ Select Doctor", "🗓️ Available Slots", "📞 Call MedTripz"],
  },
  hi: {
    default: ["👨⚕️ Doctor Dhundho", "🏥 Hospital Dekho", "📅 Appointment Book Karo"],
    doctor: ["👨⚕️ Top Specialists", "🏥 Hospital Dekho", "📅 Appointment Book Karo"],
    cost: ["📄 Reports Share Karein", "💰 Ilaaj Ka Kharcha", "🏦 Payment Options"],
    appointment: ["👨⚕️ Doctor Select Karein", "🗓️ Khali Slots", "📞 MedTripz Ko Call Karein"],
  },
  ar: {
    default: ["👨⚕️ ابحث عن طبيب", "🏥 المستشفيات", "📅 حجز موعد"],
    doctor: ["👨⚕️ أفضل الأطباء", "🏥 ابحث عن مستشفيات", "📅 حجز موعد"],
    cost: ["📄 شارك التقارير", "💰 تكلفة العلاج", "🏦 خيارات الدفع"],
    appointment: ["👨⚕️ اختر طبيباً", "🗓️ المواعيد المتاحة", "📞 اتصل بـ MedTripz"],
  }
};

function getSuggestions(message: string, lang: 'en' | 'hi' | 'ar'): string[] {
  const msg = message.toLowerCase();
  const langSet = SUGGESTIONS[lang] || SUGGESTIONS.en;

  if (msg.includes('doctor') || msg.includes('specialist') || msg.includes('طبيب')) return langSet.doctor;
  if (msg.includes('cost') || msg.includes('price') || msg.includes('سعر')) return langSet.cost;
  if (msg.includes('appointment') || msg.includes('book') || msg.includes('موعد')) return langSet.appointment;
  
  return langSet.default;
}

// Helper to safely create a message even if the client is out of sync
async function safeCreateMessage(data: any) {
  try {
    return await (prisma.chatMessage as any).create({ data });
  } catch (e: any) {
    console.error('[DB CLIENT ERROR] Client out of sync, trying Raw SQL...', e.message);
    try {
      const { chatSessionId, sender, content, metadata } = data;
      await prisma.$executeRawUnsafe(
        'INSERT INTO ChatMessage (chatSessionId, sender, content, metadata, createdAt) VALUES (?, ?, ?, ?, ?)',
        chatSessionId,
        sender,
        content,
        metadata || null,
        new Date().toISOString()
      );
      return { ...data, id: Date.now() };
    } catch (rawError: any) {
      console.error('[CRITICAL DB ERROR] Raw SQL also failed:', rawError.message);
      try {
        const { metadata, ...rest } = data;
        return await (prisma.chatMessage as any).create({ data: rest });
      } catch (finalError: any) {
        console.error('[FATAL DB ERROR] Final fallback failed:', finalError.message);
        throw finalError;
      }
    }
  }
}

export async function POST(req: Request) {
  try {
    const { sessionId, message, language = 'en' } = await req.json();

    if (!sessionId || !message?.trim()) {
      return NextResponse.json({ error: 'Missing sessionId or message' }, { status: 400 });
    }

    const userMessage = message.trim();
    const lang: 'en' | 'hi' | 'ar' = language;

    let session = await prisma.chatSession.findUnique({ where: { sessionId } });
    if (!session) session = await prisma.chatSession.create({ data: { sessionId } });

    if (isAbusive(userMessage)) {
      await prisma.chatSession.update({ where: { id: session.id }, data: { isManual: true } });
      const warning = lang === 'ar' ? "عذراً، لا يمكنني الاستمرار بسبب اللغة غير اللائقة." : "Inappropriate language detected. Admin notified.";
      await safeCreateMessage({ chatSessionId: session.id, sender: 'bot', content: warning, metadata: JSON.stringify({ lang }) });
      return NextResponse.json({ status: 'success', isManual: true, reply: warning, flagged: true, lang });
    }

    if (session.isManual) {
      await safeCreateMessage({ chatSessionId: session.id, sender: 'user', content: userMessage, metadata: JSON.stringify({ lang }) });
      return NextResponse.json({ status: 'success', isManual: true });
    }

    const dbMessages = await prisma.chatMessage.findMany({ where: { chatSessionId: session.id }, orderBy: { createdAt: 'desc' }, take: 20 });
    await safeCreateMessage({ chatSessionId: session.id, sender: 'user', content: userMessage, metadata: JSON.stringify({ lang }) });
    const history = dbMessages.reverse().map(msg => ({ role: (msg.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: msg.content }));

    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        let apiKey = (process.env.OPENROUTER_API_KEY || '').trim().replace(/^["']|["']$/g, '');
        if (!apiKey) throw new Error('API Key missing');

        const systemPrompts = {
          en: "You are a professional English AI healthcare assistant for MedTripz. Reply ONLY in professional English.",
          hi: "You are a Roman Hindi AI healthcare assistant. Reply ONLY in natural Roman Hindi using English letters only. NEVER use Hindi script.",
          ar: "You are an Arabic AI healthcare assistant. Reply ONLY in professional Arabic."
        };

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${apiKey}`, 
            'Content-Type': 'application/json', 
            'HTTP-Referer': 'https://medtripz.com', 
            'X-Title': 'MedTripz Assistant' 
          },
          body: JSON.stringify({
            model: 'openrouter/free', // Reverted to original model as requested
            messages: [
              {
                role: 'system',
                content: `${systemPrompts[lang] || systemPrompts.en}
                STRICT FORMATTING: Use numbered lists. HIGHLIGHT important names. Max 3 sentences.
                CONTACT: +91 8076615942 | Medtripz@gmail.com`
              },
              ...history,
              { role: 'user', content: userMessage }
            ],
            temperature: 0.3,
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || `Error ${response.status}`);

        let botReply = cleanResponse(data.choices?.[0]?.message?.content || '');
        if (!botReply) throw new Error('Empty AI response');

        const cards = getCards(botReply + " " + userMessage, lang);

        await safeCreateMessage({ 
          chatSessionId: session.id, 
          sender: 'bot', 
          content: botReply, 
          metadata: JSON.stringify({ lang, cards })
        });

        await prisma.chatSession.update({ where: { id: session.id }, data: { updatedAt: new Date() } });

        return NextResponse.json({ 
          status: 'success', 
          isManual: false, 
          reply: botReply, 
          suggestions: getSuggestions(botReply, lang),
          cards: cards,
          lang: lang
        });

      } catch (aiError: any) {
        lastError = aiError;
        console.error(`[AI ATTEMPT ${attempt + 1} FAILED]`, aiError.message);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }
      }
    }

    return NextResponse.json({ 
      status: 'success', 
      isManual: false, 
      reply: `Technical issue: ${lastError?.message || 'Provider error'}. Please try again in a moment.`, 
      lang: 'en' 
    });

  } catch (error: any) {
    console.error('[CRITICAL API ERROR]', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    const session = await prisma.chatSession.findUnique({ where: { sessionId }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
    if (!session) return NextResponse.json({ messages: [], isManual: false });

    const formattedMessages = session.messages.map(msg => {
      let metadata = {};
      try {
        metadata = (msg as any).metadata ? JSON.parse((msg as any).metadata) : {};
      } catch (e) {}
      return { ...msg, ...metadata };
    });

    let suggestions: string[] = [];
    if (formattedMessages.length === 0) {
      suggestions = SUGGESTIONS.en.default;
    } else {
      const last = formattedMessages[formattedMessages.length - 1];
      suggestions = getSuggestions(last.content, (last as any).lang || 'en');
    }

    return NextResponse.json({
      messages: formattedMessages,
      isManual: session.isManual,
      suggestions: suggestions
    });
  } catch (error: any) {
    console.error('[GET ERROR]', error);
    return NextResponse.json({ error: 'Internal error: ' + error.message }, { status: 500 });
  }
}
