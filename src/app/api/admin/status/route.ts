import { NextResponse } from 'next/server';

// In-memory global admin status (resets on server restart)
// For production, store this in DB or Redis
let adminIsOnline = false;

export async function GET() {
  return NextResponse.json({ adminIsOnline });
}

export async function POST(req: Request) {
  const { online } = await req.json();
  adminIsOnline = !!online;
  return NextResponse.json({ adminIsOnline });
}
