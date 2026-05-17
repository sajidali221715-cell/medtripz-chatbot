import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ── Abusive Language Detection ─────────────────────────────
const ABUSIVE_WORDS = [
  'fuck', 'fucker', 'fucking', 'shit', 'bastard', 'bitch',
  'asshole', 'madarchod', 'behenchod', 'chutiya',
];

function isAbusive(text: string): boolean {
  const lowerText = text.toLowerCase();

  return ABUSIVE_WORDS.some(word =>
    new RegExp(`\\b${word}\\b`, 'i').test(lowerText)
  );
}

// ── Response Cleaning ─────────────────────────────────────
function cleanResponse(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Suggestions ───────────────────────────────────────────
const SUGGESTIONS = {
  en: [
    "👨‍⚕️ Find Doctor",
    "🏥 Hospitals",
    "📅 Book Appointment"
  ],
  hi: [
    "👨‍⚕️ Doctor Dhundho",
    "🏥 Hospital Dekho",
    "📅 Appointment Book Karo"
  ],
  ar: [
    "👨‍⚕️ ابحث عن طبيب",
    "🏥 المستشفيات",
    "📅 حجز موعد"
  ]
};

export async function POST(req: Request) {
  try {
    const { message, language = 'en' } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const userMessage = message.trim();

    // ── Abuse Detection ─────────────────────────────────
    if (isAbusive(userMessage)) {
      return NextResponse.json({
        status: 'success',
        reply:
          language === 'ar'
            ? 'يرجى استخدام لغة محترمة.'
            : 'Please use respectful language.',
        suggestions: SUGGESTIONS[language as keyof typeof SUGGESTIONS] || SUGGESTIONS.en,
      });
    }

    // ── OpenRouter API Key ─────────────────────────────
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY missing' },
        { status: 500 }
      );
    }

    // ── Language System Prompt ─────────────────────────
    const systemPrompts = {
      en: `
You are MedTripz AI healthcare assistant.
Reply professionally in English.
Keep answers short and clear.
`,

      hi: `
You are MedTripz AI assistant.
Reply ONLY in Roman Hindi.
Never use Hindi script.
`,

      ar: `
You are MedTripz AI assistant.
Reply professionally in Arabic.
`,
    };

    // ── OpenRouter Request ────────────────────────────
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://medtripz.com',
          'X-Title': 'MedTripz AI',
        },

        body: JSON.stringify({
          model: 'openrouter/free',

          messages: [
            {
              role: 'system',
              content:
                systemPrompts[
                  language as keyof typeof systemPrompts
                ] || systemPrompts.en,
            },

            {
              role: 'user',
              content: userMessage,
            },
          ],

          temperature: 0.4,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message || 'OpenRouter API Error'
      );
    }

    let botReply =
      data?.choices?.[0]?.message?.content ||
      'No response generated';

    botReply = cleanResponse(botReply);

    return NextResponse.json({
      status: 'success',
      reply: botReply,
      suggestions:
        SUGGESTIONS[
          language as keyof typeof SUGGESTIONS
        ] || SUGGESTIONS.en,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'MedTripz AI API Running',
  });
}