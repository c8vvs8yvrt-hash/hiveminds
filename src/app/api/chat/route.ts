import { NextRequest } from 'next/server';
import { runRoundtable } from '@/lib/roundtable';
import { UserApiKeys, DiscussionMode } from '@/types';
import { getEffectiveMode } from '@/lib/complexity';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, apiKeys, mode: requestedMode = 'instant', autoSwitch = true } = body as {
      message: string;
      apiKeys?: UserApiKeys;
      mode?: DiscussionMode;
      autoSwitch?: boolean;
    };

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isPaid = !apiKeys;
    const { mode, wasUpgraded } = getEffectiveMode(requestedMode, message, autoSwitch);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(type: string, data: Record<string, unknown>) {
          const event = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(event));
        }

        // Tell client which mode is active and if it was auto-upgraded
        sendEvent('mode', { mode, wasUpgraded });

        await runRoundtable(message, {
          onRoundStart: (round) => sendEvent('round_start', { round }),
          onAIResponse: (response) => sendEvent('ai_response', {
            round: response.round,
            provider: response.provider,
            content: response.content,
            timestamp: response.timestamp,
          }),
          onConvergence: (agreed, round) => sendEvent('convergence', { agreed, round }),
          onConsensus: (content) => sendEvent('consensus', { content }),
          onError: (error) => sendEvent('error', { message: error }),
          onDone: () => {
            sendEvent('done', {});
            controller.close();
          },
        }, {
          userApiKeys: apiKeys,
          isPaid,
          mode,
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
