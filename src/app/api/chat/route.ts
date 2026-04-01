import { NextRequest } from 'next/server';
import { runRoundtable } from '@/lib/roundtable';
import { UserApiKeys, DiscussionMode, Attachment } from '@/types';
import { getEffectiveMode } from '@/lib/complexity';
import { fetchUrlContent, extractUrls } from '@/lib/url-fetcher';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Build an enriched prompt from the user message + any attachments/URLs.
 */
async function buildEnrichedMessage(
  message: string,
  attachments?: Attachment[]
): Promise<{ text: string; images: { data: string; mimeType: string }[] }> {
  const images: { data: string; mimeType: string }[] = [];
  const extraContext: string[] = [];

  // Extract and fetch any URLs in the message text
  const urls = extractUrls(message);
  if (urls.length > 0) {
    const fetches = await Promise.all(
      urls.slice(0, 3).map(async (url) => {
        const content = await fetchUrlContent(url);
        return `\n\n--- Content from ${url} ---\n${content}\n--- End ---`;
      })
    );
    extraContext.push(...fetches);
  }

  // Process attachments
  if (attachments) {
    for (const att of attachments) {
      if (att.type === 'image' && att.data && att.mimeType) {
        // Strip data URL prefix to get raw base64
        const base64 = att.data.replace(/^data:[^;]+;base64,/, '');
        images.push({ data: base64, mimeType: att.mimeType });
      } else if (att.type === 'url') {
        const content = await fetchUrlContent(att.data);
        extraContext.push(`\n\n--- Content from ${att.data} ---\n${content}\n--- End ---`);
      }
    }
  }

  let enrichedText = message;
  if (extraContext.length > 0) {
    enrichedText += '\n\nReference material:' + extraContext.join('');
  }
  if (images.length > 0) {
    enrichedText += '\n\n[User has attached image(s) — analyze them as part of your answer.]';
  }

  return { text: enrichedText, images };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      apiKeys,
      mode: requestedMode = 'instant',
      autoSwitch = true,
      attachments,
    } = body as {
      message: string;
      apiKeys?: UserApiKeys;
      mode?: DiscussionMode;
      autoSwitch?: boolean;
      attachments?: Attachment[];
    };

    if (!message?.trim() && (!attachments || attachments.length === 0)) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isPaid = !apiKeys;
    const { mode, wasUpgraded } = getEffectiveMode(requestedMode, message || '', autoSwitch);

    // Build enriched message with URL content and image references
    const { text: enrichedMessage, images } = await buildEnrichedMessage(
      message || 'Analyze this image.',
      attachments
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(type: string, data: Record<string, unknown>) {
          const event = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(event));
        }

        sendEvent('mode', { mode, wasUpgraded });

        await runRoundtable(enrichedMessage, {
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
          images,
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
