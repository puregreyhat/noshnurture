'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 flex items-center justify-center px-4">
      {/* Animated background blurs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>

        {/* Profile Card with Blur Effect */}
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl p-12 shadow-2xl text-center">
          {user && (
            <>
              {/* Profile Picture */}
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg">
                  <span className="text-5xl font-bold text-white">
                    {user.email?.charAt(0).toUpperCase() || '👤'}
                  </span>
                </div>
              </div>

              {/* Name/Email */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {user.email?.split('@')[0] || 'User'}
              </h1>
              <p className="text-gray-600 mb-8">
                {user.email}
              </p>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
