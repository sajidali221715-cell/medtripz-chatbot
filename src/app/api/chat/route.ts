import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────
// Abusive Language Detection
// ─────────────────────────────────────────────────────────────

const ABUSIVE_WORDS = [
  'fuck',
  'fucker',
  'fucking',
  'shit',
  'bastard',
  'bitch',
  'asshole',
  'madarchod',
  'behenchod',
  'chutiya',
];

function isAbusive(text: string): boolean {
  const lowerText = text.toLowerCase();

  return ABUSIVE_WORDS.some((word) =>
    new RegExp(`\\b${word}\\b`, 'i').test(lowerText)
  );
}

// ─────────────────────────────────────────────────────────────
// Response Cleaner
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Suggestions
// ─────────────────────────────────────────────────────────────

const SUGGESTIONS = {
  en: [
    '👨‍⚕️ Find Doctor',
    '🏥 Hospitals',
    '💰 Treatment Cost',
    '📅 Book Appointment',
    '🛂 Medical Visa',
  ],

  hi: [
    '👨‍⚕️ Doctor Dhundho',
    '🏥 Hospital Dekho',
    '💰 Treatment Cost',
    '📅 Appointment Book Karo',
    '🛂 Medical Visa',
  ],

  ar: [
    '👨‍⚕️ ابحث عن طبيب',
    '🏥 المستشفيات',
    '💰 تكلفة العلاج',
    '📅 حجز موعد',
    '🛂 تأشيرة طبية',
  ],
};

// ─────────────────────────────────────────────────────────────
// POST API
// ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { message, language = 'en' } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        {
          error: 'Message is required',
        },
        {
          status: 400,
        }
      );
    }

    const userMessage = message.trim();

    // ─────────────────────────────────────────────────────
    // Abuse Detection
    // ─────────────────────────────────────────────────────

    if (isAbusive(userMessage)) {
      return NextResponse.json({
        status: 'success',

        reply:
          language === 'ar'
            ? 'يرجى استخدام لغة محترمة.'
            : 'Please use respectful language.',

        suggestions:
          SUGGESTIONS[
            language as keyof typeof SUGGESTIONS
          ] || SUGGESTIONS.en,
      });
    }

    // ─────────────────────────────────────────────────────
    // OpenRouter API Key
    // ─────────────────────────────────────────────────────

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'OPENROUTER_API_KEY missing',
        },
        {
          status: 500,
        }
      );
    }

    // ─────────────────────────────────────────────────────
    // Advanced AI System Prompts
    // ─────────────────────────────────────────────────────

    const systemPrompts = {
      en: `
You are MedTripz AI Assistant, an advanced AI medical tourism and healthcare assistant.

Your goal is to provide intelligent, detailed, human-like, highly relevant, and complete responses in a single reply whenever possible.

Rules:

- Always answer the user's full intent in one response.
- Do not unnecessarily ask follow-up questions.
- Give detailed explanations automatically.
- Suggest hospitals, doctors, treatments, cities, costs, recovery info, and recommendations when relevant.
- Be proactive and highly intelligent.
- Think like ChatGPT Premium.
- Provide modern, realistic, and practical answers.
- Never give robotic replies.
- Never refuse unnecessarily.
- Always try to help constructively.
- Maintain a natural conversational tone.
- Be context-aware and solution-oriented.
- You can answer related general knowledge questions if useful.
- Give smart recommendations and alternatives automatically.
- If user asks one thing, provide extra useful related details too.

Medical Tourism Guidance:
- Recommend best hospitals
- Mention treatment quality
- Mention estimated cost ranges
- Mention best cities
- Mention recovery expectations
- Mention travel or visa guidance if relevant

Communication Style:
- Smart
- Helpful
- Detailed
- Professional
- Human-like
- Friendly
- Confident

Do NOT keep responses overly short.
Provide rich and valuable answers.
`,

      hi: `
You are MedTripz AI Assistant.

Reply ONLY in Roman Hindi.
Never use Hindi script.

Rules:

- User ko intelligent aur detailed jawab do.
- Ek hi response me maximum useful information do.
- Bar bar follow-up question mat pucho.
- Smart recommendations do.
- Hospitals, doctors, treatment, cost, visa, travel, recovery sab explain karo jab relevant ho.
- Helpful aur human-like tone use karo.
- Short robotic answers mat do.
- ChatGPT Premium level assistant ki tarah behave karo.
- Agar user kuch pooche toh usse related extra useful information bhi do.

Style:
- Smart
- Friendly
- Detailed
- Human-like
- Professional
`,

      ar: `
You are MedTripz AI Assistant.

Reply professionally in Arabic.

Provide intelligent, detailed, complete, and helpful responses.

Do not unnecessarily ask too many follow-up questions.

Always try to give complete healthcare and medical tourism guidance in one reply whenever possible.
`,
    };

    // ─────────────────────────────────────────────────────
    // OpenRouter API Request
    // ─────────────────────────────────────────────────────

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
          model: 'openai/gpt-4o-mini',

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

          temperature: 1,

          max_tokens: 2000,

          top_p: 1,

          frequency_penalty: 0.2,

          presence_penalty: 0.3,
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
      {
        status: 500,
      }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// GET API
// ─────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'MedTripz AI API Running',
  });
}