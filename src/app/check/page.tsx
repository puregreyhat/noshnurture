"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";
import ThreeDFrameShowcase from "@/components/demos/ThreeDFrameShowcase";

const demoOptions = [
  {
    id: "page1",
    title: "Hero scrub",
    subtitle: "Full-screen scroll-controlled reveal",
    description:
      "Best when you want the 3D sequence to own the first impression and lead the page narrative.",
    tone: "from-emerald-500/20 to-emerald-300/5",
    accent: "text-emerald-700",
  },
  {
    id: "page2",
    title: "Pinned showcase",
    subtitle: "Mid-page feature block",
    description:
      "Best when the animation should sit beside supporting copy and feel like part of the dashboard story.",
    tone: "from-amber-500/20 to-amber-300/5",
    accent: "text-amber-700",
  },
  {
    id: "page3",
    title: "Premium intro",
    subtitle: "Smaller autoplay block",
    description:
      "Best when you want the motion to feel polished but not overpower the rest of the interface.",
    tone: "from-sky-500/20 to-sky-300/5",
    accent: "text-sky-700",
  },
] as const;

export default function CheckPage() {
  const [activeDemo, setActiveDemo] = useState<(typeof demoOptions)[number]["id"]>("page1");
  const activeOption = demoOptions.find((option) => option.id === activeDemo) ?? demoOptions[0];

  return (
    <main className="min-h-screen bg-[#FDFBF7] relative overflow-hidden selection:bg-emerald-100 selection:text-emerald-900 font-['Poppins']">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-50 via-[#FDFBF7] to-[#FDFBF7]" />
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-50/60 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-50/60 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-10 pb-20 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto pt-8 sm:pt-16">
          <div className="mb-8 inline-flex items-center justify-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-stone-200 shadow-sm">
            <Sparkles className="text-amber-500 w-5 h-5 mr-2" />
            <span className="text-stone-600 font-medium tracking-wide text-sm uppercase">Dashboard 3D sandbox</span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-bold text-emerald-900 mb-8 tracking-tight leading-tight">
            Nurture your <br />
            <span className="italic text-emerald-700">dashboard preview</span>
          </h1>

          <p className="text-lg sm:text-2xl text-stone-600 font-light max-w-2xl mx-auto leading-relaxed">
            Compare the three 3D concepts in a page that follows the same warm dashboard language, without changing the live experience.
          </p>

          <div className="mt-12 mx-auto w-fit p-6 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
            <Leaf size={48} className="text-emerald-600" />
          </div>

          <div className="mt-16 flex flex-col items-center justify-center text-stone-400 font-medium tracking-widest text-xs uppercase">
            <span className="mb-3">Explore sandbox</span>
            <div className="w-8 h-12 border-2 border-stone-300 rounded-full flex justify-center p-1">
              <div className="w-1 h-2 bg-stone-400 rounded-full" />
            </div>
          </div>
        </div>

        <section className="mt-24 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] items-start">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-stone-100 bg-white/70 backdrop-blur-sm shadow-sm p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Select a concept</p>
                  <h2 className="mt-2 text-2xl md:text-3xl font-serif font-bold text-stone-800">
                    Decide which 3D treatment feels right inside the dashboard vibe.
                  </h2>
                </div>
                <div className="hidden sm:inline-flex rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs uppercase tracking-[0.25em] text-stone-500">
                  Preview only
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {demoOptions.map((option) => {
                  const isActive = activeDemo === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setActiveDemo(option.id)}
                      className={`rounded-[1.75rem] border p-5 text-left transition-all ${
                        isActive
                          ? "border-emerald-300 bg-emerald-50 shadow-[0_12px_40px_rgba(16,185,129,0.10)]"
                          : "border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm"
                      }`}
                    >
                      <div className={`inline-flex rounded-full bg-gradient-to-br px-3 py-1 text-xs font-medium ${option.tone} ${option.accent}`}>
                        {option.subtitle}
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-stone-900">{option.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-stone-600">{option.description}</p>
                      <div className="mt-5 flex items-center justify-between text-sm">
                        <span className={isActive ? "text-emerald-700" : "text-stone-400"}>
                          {isActive ? "Selected" : "Choose"}
                        </span>
                        <ArrowRight className={`transition-transform ${isActive ? "text-emerald-700" : "text-stone-300"}`} size={16} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.75rem] border border-stone-100 bg-white/70 backdrop-blur-sm p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-400">Best for</p>
                <p className="mt-2 text-lg font-semibold text-stone-900">Dashboard hero testing</p>
              </div>
              <div className="rounded-[1.75rem] border border-stone-100 bg-white/70 backdrop-blur-sm p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-400">Current mode</p>
                <p className="mt-2 text-lg font-semibold text-stone-900">{activeOption.title}</p>
              </div>
              <div className="rounded-[1.75rem] border border-stone-100 bg-white/70 backdrop-blur-sm p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-400">Next step</p>
                <p className="mt-2 text-lg font-semibold text-stone-900">Apply it after approval</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-100 bg-white/70 backdrop-blur-sm shadow-sm p-4 md:p-5">
            <div className="flex items-center justify-between px-2 pb-4 text-sm text-stone-500">
              <span>Live preview</span>
              <span className="font-medium text-stone-800">/{activeDemo}</span>
            </div>
            <div className="overflow-hidden rounded-[1.75rem] border border-stone-100 bg-[#06100d]">
              <ThreeDFrameShowcase variant={activeDemo} />
            </div>
          </div>
        </section>

        <div className="mt-10 text-center text-sm text-stone-500">
          This page is a sandbox. It does not modify the dashboard or homepage until you approve a choice.
        </div>
      </div>
    </main>
  );
}
