import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/conversations/:id/messages — add a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { role, content, discussion } = body as {
    role: string;
    content: string;
    discussion?: unknown;
  };

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      role,
      content,
      discussion: discussion ? JSON.parse(JSON.stringify(discussion)) : undefined,
    },
  });

  // Auto-generate title from first user message
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: { title: true },
  });
  if (role === 'user' && conversation?.title === 'New chat') {
    const autoTitle = content.length > 50 ? content.slice(0, 50) + '...' : content;
    await prisma.conversation.update({
      where: { id },
      data: { title: autoTitle },
    });
  }

  return NextResponse.json({ message });
}
