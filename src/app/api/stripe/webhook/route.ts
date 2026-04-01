import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;

      if (userId && plan) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            tier: plan,
            stripeSubId: session.subscription as string,
            usageCount: 0,
            usageResetAt: new Date(),
          },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const user = await prisma.user.findFirst({
        where: { stripeSubId: sub.id },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { tier: 'FREE', stripeSubId: null },
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { tier: 'FREE' },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
