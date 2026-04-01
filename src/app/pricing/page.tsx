'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useState } from 'react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try it with your own API keys',
    features: ['5 discussions per day', 'All 5 AI models', 'Bring your own API keys', 'Consensus answers', 'Roundtable view'],
    plan: null,
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$25',
    period: '/month',
    description: 'For regular users who want it all',
    features: ['200 discussions per month', 'All 5 AI models included', 'No API keys needed', 'Priority processing', 'Chat history'],
    plan: 'PRO',
    highlighted: true,
  },
  {
    name: 'Max',
    price: '$55',
    period: '/month',
    description: 'For power users and teams',
    features: ['750 discussions per month', 'All 5 AI models included', 'No API keys needed', 'Fastest processing', 'Chat history + export'],
    plan: 'MAX',
    highlighted: false,
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    if (!session) {
      signIn(undefined, { callbackUrl: '/pricing' });
      return;
    }

    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert('Something went wrong. Please try again.');
    }
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🐝</span>
            <span className="text-xl font-bold text-zinc-100">HiveMinds</span>
          </Link>
          <Link href="/chat" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Back to Chat
          </Link>
        </div>
      </nav>

      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-100 text-center mb-4">
            Simple pricing
          </h1>
          <p className="text-zinc-400 text-center mb-12">
            Start free. Upgrade when you&apos;re hooked.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-6 border ${
                  p.highlighted
                    ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20'
                    : 'border-zinc-700 bg-zinc-900/50'
                }`}
              >
                {p.highlighted && (
                  <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="mt-4 mb-2">
                  <h3 className="text-xl font-bold text-zinc-100">{p.name}</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-zinc-100">{p.price}</span>
                  <span className="text-zinc-500">{p.period}</span>
                </div>
                <p className="text-sm text-zinc-400 mb-6">{p.description}</p>

                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {p.plan ? (
                  <button
                    onClick={() => handleUpgrade(p.plan!)}
                    disabled={loading === p.plan}
                    className={`block text-center w-full py-3 rounded-xl font-medium text-sm transition-colors ${
                      p.highlighted
                        ? 'bg-amber-500 text-black hover:bg-amber-400'
                        : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                    } disabled:opacity-50`}
                  >
                    {loading === p.plan ? 'Loading...' : `Start ${p.name}`}
                  </button>
                ) : (
                  <Link
                    href="/chat"
                    className="block text-center w-full py-3 rounded-xl font-medium text-sm border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    Get Started
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
