'use client';

import Link from 'next/link';
import { ArrowRight, MessageSquare, Zap, Shield, Check } from 'lucide-react';

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try it with your own API keys',
    features: [
      '5 discussions per day',
      'All 5 AI models',
      'Bring your own API keys',
      'Consensus answers',
      'Roundtable view',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$25',
    period: '/month',
    description: 'For regular users who want it all',
    features: [
      '200 discussions per month',
      'All 5 AI models included',
      'No API keys needed',
      'Priority processing',
      'Chat history',
    ],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    name: 'Max',
    price: '$55',
    period: '/month',
    description: 'For power users and teams',
    features: [
      '750 discussions per month',
      'All 5 AI models included',
      'No API keys needed',
      'Fastest processing',
      'Chat history + export',
    ],
    cta: 'Start Max',
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <nav className="border-b border-zinc-800/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐝</span>
            <span className="text-xl font-bold text-zinc-100">HiveMinds</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              Pricing
            </a>
            <Link
              href="/chat"
              className="text-sm bg-amber-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-amber-400 transition-colors"
            >
              Open App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-24 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-2 mb-6">
            {['Gemini', 'Llama', 'Mistral', 'Cohere', 'DeepSeek'].map((name) => (
              <span
                key={name}
                className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-700"
              >
                {name}
              </span>
            ))}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-zinc-100 mb-6 leading-tight">
            Ask once.
            <br />
            <span className="text-amber-400">Get the wisdom of every AI.</span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            Instead of asking one AI, HiveMinds puts 5 different AI models at
            one table. They discuss your question, debate each other, and
            deliver one expert consensus answer.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 text-black px-8 py-4 rounded-xl text-lg font-semibold hover:bg-amber-400 transition-colors"
            >
              Try HiveMinds Free
              <ArrowRight size={20} />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 border border-zinc-700 text-zinc-300 px-8 py-4 rounded-xl text-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              View Pricing
            </a>
          </div>

          <p className="text-sm text-zinc-500 mt-4">
            Why pay $60+/mo for separate subscriptions?
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-zinc-100 text-center mb-4">
            How it works
          </h2>
          <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
            Your question goes to 5 AIs simultaneously. They don&apos;t just answer —
            they discuss, debate, and converge.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-amber-400" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                1. You ask
              </h3>
              <p className="text-zinc-400 text-sm">
                Type any question — coding help, research, advice, creative ideas.
                One input, that&apos;s it.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="text-amber-400" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                2. AIs debate
              </h3>
              <p className="text-zinc-400 text-sm">
                5 AI models answer independently, then discuss each other&apos;s
                responses across multiple rounds until they agree.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="text-amber-400" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                3. Consensus delivered
              </h3>
              <p className="text-zinc-400 text-sm">
                You get one expert answer, synthesized from the best of all 5 AIs.
                Plus you can view the full roundtable discussion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="px-6 py-20 border-t border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-zinc-100 mb-10">
            Stop paying for 4 subscriptions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-red-500/20">
              <h3 className="font-semibold text-red-400 mb-4">Without HiveMinds</h3>
              <div className="space-y-2 text-sm text-zinc-400">
                <p>Ask ChatGPT — get one opinion</p>
                <p>Ask Claude — get another opinion</p>
                <p>Ask Gemini — get a third</p>
                <p>Compare them yourself...</p>
                <div className="border-t border-zinc-700 pt-2 mt-3">
                  <p className="text-lg font-bold text-red-400">Slow & tedious</p>
                  <p className="text-xs text-zinc-500">You do all the comparing manually</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-6 border border-amber-500/30">
              <h3 className="font-semibold text-amber-400 mb-4">With HiveMinds Pro</h3>
              <div className="space-y-2 text-sm text-zinc-400">
                <p>All 5 AIs included</p>
                <p>They discuss together</p>
                <p>One consensus answer</p>
                <p>200 discussions/month</p>
                <div className="border-t border-zinc-700 pt-2 mt-3">
                  <p className="text-lg font-bold text-amber-400">$25/month</p>
                  <p className="text-xs text-zinc-500">Save over $40/month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-zinc-100 text-center mb-4">
            Simple pricing
          </h2>
          <p className="text-zinc-400 text-center mb-12">
            Start free. Upgrade when you&apos;re hooked.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 border ${
                  plan.highlighted
                    ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20'
                    : 'border-zinc-700 bg-zinc-900/50'
                }`}
              >
                {plan.highlighted && (
                  <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="mt-4 mb-2">
                  <h3 className="text-xl font-bold text-zinc-100">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-zinc-100">
                    {plan.price}
                  </span>
                  <span className="text-zinc-500">{plan.period}</span>
                </div>
                <p className="text-sm text-zinc-400 mb-6">{plan.description}</p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/chat"
                  className={`block text-center w-full py-3 rounded-xl font-medium text-sm transition-colors ${
                    plan.highlighted
                      ? 'bg-amber-500 text-black hover:bg-amber-400'
                      : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🐝</span>
            <span className="text-sm text-zinc-500">HiveMinds</span>
          </div>
          <p className="text-xs text-zinc-600">
            Powered by Gemini, Llama, Mistral, Cohere & DeepSeek
          </p>
        </div>
      </footer>
    </div>
  );
}
