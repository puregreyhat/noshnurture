"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const frameNumbers = [1, ...Array.from({ length: 229 }, (_, index) => index + 12)];
const frameSources = frameNumbers.map(
  (frameNumber) => `/3d-sequence/ezgif-frame-${String(frameNumber).padStart(3, "0")}.png`
);

const pageLinks = [
  { href: "/page1", label: "Page 1" },
  { href: "/page2", label: "Page 2" },
  { href: "/page3", label: "Page 3" },
  { href: "/", label: "Home" },
];

const scrollHighlights = [
  {
    eyebrow: "Full-screen hero",
    title: "Scroll to scrub the entire 3D scene.",
    description:
      "This version turns the frame sequence into a cinematic landing hero. The visual stays pinned while scroll controls the motion.",
    stats: ["Best for first impression", "Highest impact", "Scroll-driven"],
  },
  {
    eyebrow: "Pinned showcase",
    title: "Keep the scene anchored while the story changes.",
    description:
      "This layout is better when you want supporting copy, feature callouts, or product story around the 3D motion.",
    stats: ["Best for feature blocks", "Balanced layout", "Story-led"],
  },
  {
    eyebrow: "Premium intro",
    title: "Use the motion as a smaller, polished opening.",
    description:
      "This keeps the animation present but not dominant, which is useful if the rest of the page needs more attention.",
    stats: ["Best for elegance", "Lower visual weight", "Autoplay loop"],
  },
];

const showcaseSteps = [
  {
    label: "01",
    title: "Arrival",
    description:
      "The scene opens with the floating grocery cluster. This establishes the product language immediately.",
  },
  {
    label: "02",
    title: "Momentum",
    description:
      "As the user scrolls, the objects orbit and rearrange. That gives the section a live, guided feel.",
  },
  {
    label: "03",
    title: "Premium finish",
    description:
      "The sequence settles into a composed product stack, which works well for a closing message or CTA.",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function useSectionProgress() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const section = sectionRef.current;
      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const scrollTop = window.scrollY || window.pageYOffset;
      const start = scrollTop + rect.top;
      const end = start + rect.height - window.innerHeight;
      const nextProgress = end <= start ? 0 : (scrollTop - start) / (end - start);

      setProgress(clamp(nextProgress, 0, 1));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { sectionRef, progress };
}

function useAutoplayFrame(totalFrames: number, isPlaying: boolean, speed = 70) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = window.setInterval(() => {
      setFrameIndex((currentIndex) => (currentIndex + 1) % totalFrames);
    }, speed);

    return () => window.clearInterval(timer);
  }, [isPlaying, speed, totalFrames]);

  return frameIndex;
}

function useFramePreload(frameIndex: number) {
  useEffect(() => {
    const indexes = [frameIndex - 2, frameIndex - 1, frameIndex, frameIndex + 1, frameIndex + 2];

    indexes.forEach((index) => {
      if (index < 0 || index >= frameSources.length) {
        return;
      }

      const image = new window.Image();
      image.src = frameSources[index];
    });
  }, [frameIndex]);
}

function TopBar({ activeHref }: { activeHref: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07110f]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">3D demo lab</p>
          <p className="text-sm text-emerald-50">Frame sequence exploration</p>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {pageLinks.map((link) => {
            const active = link.href === activeHref;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? "border-emerald-300 bg-emerald-300/15 text-emerald-50"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function FrameStage({
  frameIndex,
  label,
  className = "",
}: {
  frameIndex: number;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_rgba(9,15,13,0.98)_60%)] shadow-[0_40px_120px_rgba(0,0,0,0.45)] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_45%)]" />
      <img
        src={frameSources[frameIndex]}
        alt={label}
        className="relative z-10 h-full w-full select-none object-contain"
        draggable={false}
        decoding="async"
      />
    </div>
  );
}

function PageOneScrollScrub() {
  const { sectionRef, progress } = useSectionProgress();
  const frameIndex = Math.round(progress * (frameSources.length - 1));

  useFramePreload(frameIndex);

  return (
    <main className="min-h-screen bg-[#06100d] text-[#f6f0e6]">
      <TopBar activeHref="/page1" />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.12),_transparent_30%)]" />
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-emerald-100">
                {scrollHighlights[0].eyebrow}
              </div>
              <div className="space-y-5">
                <h1 className="max-w-xl text-5xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
                  {scrollHighlights[0].title}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
                  {scrollHighlights[0].description}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {scrollHighlights[0].stats.map((stat) => (
                  <div key={stat} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75 backdrop-blur-sm">
                    {stat}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/page2"
                  className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-medium text-emerald-950 transition hover:bg-emerald-200"
                >
                  Open pinned showcase
                </Link>
                <Link
                  href="/page3"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10"
                >
                  Open intro block
                </Link>
              </div>
            </div>

            <div ref={sectionRef} className="relative h-[320vh] lg:h-[360vh]">
              <div className="sticky top-20 flex h-[calc(100vh-5rem)] items-center">
                <FrameStage
                  frameIndex={frameIndex}
                  label="Scroll-scrubbed grocery composition"
                  className="h-[72vh] w-full"
                />
                <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/75 backdrop-blur-md">
                  {frameIndex + 1} / {frameSources.length}
                </div>
                <div className="absolute right-4 top-4 rounded-full border border-emerald-300/20 bg-emerald-300/12 px-4 py-2 text-xs uppercase tracking-[0.25em] text-emerald-50 backdrop-blur-md">
                  Scroll progress {Math.round(progress * 100)}%
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/10 bg-[#07110f]/70 px-5 py-4 text-sm text-white/72 backdrop-blur-md">
                  The scene is designed to feel like a live product reveal. The image stays crisp while the user controls the camera through scroll.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PageTwoPinnedShowcase() {
  const { sectionRef, progress } = useSectionProgress();
  const frameIndex = Math.round(progress * (frameSources.length - 1));
  const activeStep = progress < 0.34 ? 0 : progress < 0.67 ? 1 : 2;

  useFramePreload(frameIndex);

  return (
    <main className="min-h-screen bg-[#081210] text-[#f5efe5]">
      <TopBar activeHref="/page2" />

      <section className="mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-100">
            {scrollHighlights[1].eyebrow}
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            {scrollHighlights[1].title}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-white/72">
            {scrollHighlights[1].description}
          </p>
        </div>
      </section>

      <div ref={sectionRef} className="relative h-[260vh]">
        <div className="sticky top-20 h-[calc(100vh-5rem)]">
          <div className="mx-auto grid h-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="flex flex-col justify-center gap-4">
              {showcaseSteps.map((step, index) => {
                const active = index === activeStep;

                return (
                  <article
                    key={step.label}
                    className={`rounded-[1.75rem] border p-6 transition duration-300 ${
                      active
                        ? "border-emerald-300/30 bg-emerald-300/10 shadow-[0_20px_80px_rgba(16,185,129,0.12)]"
                        : "border-white/10 bg-white/5 opacity-70"
                    }`}
                  >
                    <p className={`text-xs uppercase tracking-[0.35em] ${active ? "text-emerald-100" : "text-white/45"}`}>
                      {step.label}
                    </p>
                    <h2 className="mt-3 text-2xl font-medium text-white">{step.title}</h2>
                    <p className="mt-3 text-base leading-7 text-white/68">{step.description}</p>
                  </article>
                );
              })}
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">Best use</p>
                <p className="mt-3 text-lg leading-8 text-white/80">
                  This style works well when the animation should support the page instead of owning it, especially in feature sections, explainers, or product showcases.
                </p>
              </div>
            </div>

            <div className="relative flex items-center">
              <FrameStage
                frameIndex={frameIndex}
                label="Pinned showcase grocery composition"
                className="h-[78vh] w-full"
              />
              <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-4 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/75 backdrop-blur-md">
                <span>Pinned story section</span>
                <span>{Math.round(progress * 100)}% complete</span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/10 bg-[#07110f]/70 px-5 py-4 text-sm text-white/72 backdrop-blur-md">
                Frame {frameIndex + 1} of {frameSources.length}. The chapter cards on the left respond to the same scroll position, which gives the section a guided narrative feel.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function PageThreeIntroBlock() {
  const [isPlaying, setIsPlaying] = useState(true);
  const frameIndex = useAutoplayFrame(frameSources.length, isPlaying, 70);

  useFramePreload(frameIndex);

  return (
    <main className="min-h-screen bg-[#0a1210] text-[#f5efe4]">
      <TopBar activeHref="/page3" />

      <section className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="flex flex-col justify-center space-y-8">
          <div className="inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-sky-100">
            {scrollHighlights[2].eyebrow}
          </div>
          <div className="space-y-5">
            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              {scrollHighlights[2].title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/72">
              {scrollHighlights[2].description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((currentValue) => !currentValue)}
              className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-medium text-emerald-950 transition hover:bg-emerald-200"
            >
              {isPlaying ? "Pause motion" : "Resume motion"}
            </button>
            <Link
              href="/page1"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10"
            >
              See scroll version
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {scrollHighlights[2].stats.map((stat) => (
              <div key={stat} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75 backdrop-blur-sm">
                {stat}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.12),_transparent_40%)] blur-2xl" />
          <FrameStage
            frameIndex={frameIndex}
            label="Autoplaying grocery composition"
            className="h-[70vh] w-full max-w-3xl"
          />
          <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/75 backdrop-blur-md">
            Autoplay preview
          </div>
          <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/10 bg-[#07110f]/70 px-5 py-4 text-sm text-white/72 backdrop-blur-md">
            This can sit above a hero title or a product callout. It keeps the motion present without taking over the layout.
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ThreeDFrameShowcase({ variant }: { variant: "page1" | "page2" | "page3" }) {
  if (variant === "page1") {
    return <PageOneScrollScrub />;
  }

  if (variant === "page2") {
    return <PageTwoPinnedShowcase />;
  }

  return <PageThreeIntroBlock />;
}
