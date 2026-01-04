"use client";
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import HeroSection from "@/components/home/HeroSection";
import FeatureCard from "@/components/home/FeatureCard";
import { ScanLine, ChefHat, Clock, BarChart3, Bell, ShieldCheck } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <Loading />;
  }

  if (user) {
    return null; // Will redirect
  }

  const features = [
    {
      title: "Smart Scanning",
      description: "Instantly add items by scanning receipts or product barcodes. Our AI recognizes thousands of products.",
      icon: ScanLine,
      delay: 0.2,
    },
    {
      title: "Expiry Tracking",
      description: "Never let food go to waste. Get timely notifications before your groceries expire.",
      icon: Clock,
      delay: 0.3,
    },
    {
      title: "AI Chef",
      description: "Don't know what to cook? Get personalized recipe suggestions based on what you have in stock.",
      icon: ChefHat,
      delay: 0.4,
    },
    {
      title: "Usage Analytics",
      description: "Track your consumption habits and save money by optimizing your grocery shopping.",
      icon: BarChart3,
      delay: 0.5,
    },
    {
      title: "Smart Alerts",
      description: "Customizable notifications for low stock and expiring items so you're always prepared.",
      icon: Bell,
      delay: 0.6,
    },
    {
      title: "Secure & Private",
      description: "Your data is encrypted and secure. We prioritize your privacy above everything else.",
      icon: ShieldCheck,
      delay: 0.7,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] relative overflow-hidden selection:bg-emerald-100 selection:text-emerald-900 font-['Poppins']">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-50 via-[#FDFBF7] to-[#FDFBF7]" />
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-50/60 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-50/60 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 pb-40">
        <HeroSection />

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-4">
              Everything you need to <br />
              <span className="text-emerald-700">manage your kitchen</span>
            </h2>
            <p className="text-stone-500 max-w-2xl mx-auto font-light text-lg">
              Powerful features to help you save money, reduce waste, and eat better.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                delay={feature.delay}
              />
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="container mx-auto px-4 pb-32 pt-10 text-center">
          <div className="bg-emerald-900 rounded-[2.5rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-800/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-950/50 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

            {/* Grain texture overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-emerald-50 mb-6 leading-tight">
                Ready to transform your kitchen?
              </h2>
              <p className="text-emerald-100/80 text-lg mb-10 font-light">
                Join thousands of users who are saving money and reducing food waste with NoshNurture.
              </p>
              <button
                onClick={() => router.push('/auth')}
                className="px-10 py-4 bg-[#FDFBF7] text-emerald-900 font-bold rounded-full shadow-lg hover:bg-white transition-all hover:scale-105 hover:shadow-xl"
              >
                Start Your Journey
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
