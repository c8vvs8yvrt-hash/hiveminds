import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/conversations — list user's conversations
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ conversations: [] });
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId },
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
  const { title, messages } = body as {
    title?: string;
    messages?: { role: string; content: string; discussion?: unknown }[];
  };

  const conversation = await prisma.conversation.create({
    data: {
      title: title || 'New chat',
      messages: messages
        ? {
            create: messages.map((m) => ({
              role: m.role,
              content: m.content,
              discussion: m.discussion ? JSON.parse(JSON.stringify(m.discussion)) : undefined,
            })),
          }
        : undefined,
    },
    include: { messages: true },
  });

  return NextResponse.json({ conversation });
}
