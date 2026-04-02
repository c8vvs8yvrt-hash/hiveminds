import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/conversations — list conversations
export async function GET(req: NextRequest) {
  const deviceId = req.headers.get('x-device-id');

  const conversations = await prisma.conversation.findMany({
    where: deviceId ? { userId: deviceId } : {},
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
    take: 50,
  });

  return NextResponse.json({ conversations });
}

// POST /api/conversations — create a new conversation
export async function POST(req: NextRequest) {
  const body = await req.json();
  const deviceId = req.headers.get('x-device-id');
  const { title } = body as { title?: string };

  const conversation = await prisma.conversation.create({
    data: {
      title: title || 'New chat',
      userId: deviceId || null,
    },
  });

  return NextResponse.json({ conversation });
}
