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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <Leaf className="w-20 h-20 text-emerald-600 mx-auto mb-6" />
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-emerald-600">NoshNurture</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Reduce food waste with AI-powered recipe suggestions. Track your ingredients, 
            get smart recipe recommendations, and never let food go to waste again.
          </p>
          <Link
            href="/auth"
            className="inline-block px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
