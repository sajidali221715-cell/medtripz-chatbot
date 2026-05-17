import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET /api/admin/sessions/[id] — fetch messages + mode for a session
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const session = await prisma.chatSession.findUnique({
      where: { id: parseInt(id) },
      include: {
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      messages: session.messages,
      isManual: session.isManual,
      sessionId: session.sessionId,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    console.error('[GET /api/admin/sessions/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/sessions/[id] — toggleMode or sendMessage
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { action, message } = await req.json();
    const sessionDbId = parseInt(id);

    const session = await prisma.chatSession.findUnique({ where: { id: sessionDbId } });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // ── Toggle AI ↔ Manual mode ──────────────────────────────
    if (action === 'toggleMode') {
      const updated = await prisma.chatSession.update({
        where: { id: sessionDbId },
        data: { isManual: !session.isManual, updatedAt: new Date() }
      });
      return NextResponse.json({ isManual: updated.isManual });
    }

    // ── Admin sends a reply ──────────────────────────────────
    if (action === 'sendMessage' && message) {
      const newMsg = await prisma.chatMessage.create({
        data: {
          chatSessionId: sessionDbId,
          sender: 'admin',
          content: message
        }
      });

      await prisma.chatSession.update({
        where: { id: sessionDbId },
        data: { updatedAt: new Date() }
      });

      return NextResponse.json({ status: 'success', message: newMsg });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/admin/sessions/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
