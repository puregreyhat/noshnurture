"use client";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Leaf, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-emerald-200 rounded-full opacity-30 filter blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-green-200 rounded-full opacity-25 filter blur-3xl animate-blob animation-delay-2000" />

      <div className="container mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Hero text */}
          <div>
            <Leaf className="w-16 h-16 text-emerald-600 mb-4" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Feed your family, not the bin.
            </h1>
            <p className="text-lg text-gray-600 mb-6 max-w-xl">
              NoshNurture helps you track groceries, spot expiring items, and
              turn leftovers into delicious recipes — powered by smart
              normalization and personalized suggestions.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow hover:bg-emerald-700 transition-transform transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>

              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 border border-emerald-600 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition"
              >
                Explore demo
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 max-w-sm">
              <div className="bg-white rounded-lg p-3 text-center shadow">
                <div className="text-sm text-gray-500">Inventory</div>
                <div className="text-lg font-bold text-gray-900">124</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow">
                <div className="text-sm text-gray-500">Recipes</div>
                <div className="text-lg font-bold text-gray-900">1.2k</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow">
                <div className="text-sm text-gray-500">Saved</div>
                <div className="text-lg font-bold text-gray-900">32</div>
              </div>
            </div>
          </div>

          {/* Right: Feature card */}
          <div>
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-50">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">How it helps</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <div>
                    <div className="font-semibold">Auto-import orders</div>
                    <div className="text-sm text-gray-500">Scan receipts or import your Vkart orders in one click.</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <div>
                    <div className="font-semibold">Expiry-aware recipes</div>
                    <div className="text-sm text-gray-500">Get recipe suggestions focused on items that are about to go off.</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <div>
                    <div className="font-semibold">Edit & manage inventory</div>
                    <div className="text-sm text-gray-500">Adjust quantities, expiry, and categories with a simple editor.</div>
                  </div>
                </li>
              </ul>

              <div className="mt-6 text-sm text-gray-500">No account? Try the demo dashboard to see suggestions and the scanner flow.</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`@keyframes blob { 0%,100%{ transform: translate(0,0) scale(1);} 33%{ transform: translate(30px,-40px) scale(1.05);} 66%{ transform: translate(-20px,20px) scale(0.95);} } .animate-blob{ animation: blob 8s infinite; } .animation-delay-2000{ animation-delay: 2s; }`}</style>
    </div>
  );
}
