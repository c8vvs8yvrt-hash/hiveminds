import { NextRequest } from 'next/server';
import { runRoundtable } from '@/lib/roundtable';
import { UserApiKeys } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120; // Allow up to 2 minutes for multi-round discussions

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, apiKeys } = body as {
      message: string;
      apiKeys?: UserApiKeys;
    };

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: Check auth + usage limits here once NextAuth/Prisma are wired up
    // For now, determine if paid based on whether server keys exist
    const isPaid = !apiKeys; // If no user keys sent, assume using server keys

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(type: string, data: Record<string, unknown>) {
          const event = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(event));
        }

        await runRoundtable(message, {
          onRoundStart: (round) => {
            sendEvent('round_start', { round });
          },
          onAIResponse: (response) => {
            sendEvent('ai_response', {
              round: response.round,
              provider: response.provider,
              content: response.content,
              timestamp: response.timestamp,
            });
          },
          onConvergence: (agreed, round) => {
            sendEvent('convergence', { agreed, round });
          },
          onConsensus: (content) => {
            sendEvent('consensus', { content });
          },
          onError: (error) => {
            sendEvent('error', { message: error });
          },
          onDone: () => {
            sendEvent('done', {});
            controller.close();
          },
        }, {
          userApiKeys: apiKeys,
          isPaid,
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
