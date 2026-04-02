import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/projects — list projects
export async function GET(req: NextRequest) {
  const deviceId = req.headers.get('x-device-id');

  const projects = await prisma.project.findMany({
    where: deviceId ? { deviceId } : {},
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { conversations: true } },
    },
    take: 50,
  });

  return NextResponse.json({ projects });
}

// POST /api/projects — create a project
export async function POST(req: NextRequest) {
  const body = await req.json();
  const deviceId = req.headers.get('x-device-id');
  const { name, description, emoji } = body as {
    name: string;
    description?: string;
    emoji?: string;
  };

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      emoji: emoji || '📁',
      deviceId: deviceId || null,
    },
  });

  return NextResponse.json({ project });
}
