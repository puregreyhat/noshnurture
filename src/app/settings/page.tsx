'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getSettings, saveSettings } from '@/lib/settings';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  // Auto-fetch settings
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load settings on mount
  useEffect(() => {
    try {
      const settings = getSettings();
      setAutoFetchEnabled(settings.autoFetchVkartOrders || false);
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Toggle auto-fetch setting
  const handleAutoFetchToggle = async (enabled: boolean) => {
    try {
      setAutoFetchEnabled(enabled);
      saveSettings({ autoFetchVkartOrders: enabled });
      setSyncStatus('success');
      setSyncMessage(enabled ? '✓ Auto-fetch enabled' : '✓ Auto-fetch disabled');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage('Failed to save setting');
      console.error('Error saving settings:', error);
    }
  };

  // Manual sync from v-it
  const handleManualSync = async () => {
    if (!user) {
      setSyncStatus('error');
      setSyncMessage('Please sign in first');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');
    setSyncMessage('');

    try {
      const res = await fetch('/api/vkart-sync', { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        setSyncStatus('error');
        setSyncMessage(json?.error || 'Sync failed');
        return;
      }

      const imported = json.imported ?? 0;
      const updated = json.updated ?? 0;
      setSyncStatus('success');
      setSyncMessage(`✓ Imported ${imported}, Updated ${updated} items`);
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background blurs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -25, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
      </div>

      <motion.div 
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </motion.div>

        {/* Profile Card with Blur Effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          whileHover={{ scale: 1.02, translateY: -10 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl p-12 shadow-2xl text-center"
        >
          {user && (
            <>
              {/* Profile Picture */}
              <motion.div 
                className="mb-6 flex justify-center"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 100 }}
              >
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.1 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg"
                >
                  <span className="text-5xl font-bold text-white">
                    {user.email?.charAt(0).toUpperCase() || '👤'}
                  </span>
                </motion.div>
              </motion.div>

              {/* Name/Email */}
              <motion.h1 
                className="text-3xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                {user.email?.split('@')[0] || 'User'}
              </motion.h1>
              <motion.p 
                className="text-gray-600 mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                {user.email}
              </motion.p>

              {/* Auto-Fetch Orders Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.5 }}
                className="mb-8 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Auto-Fetch v-it Orders</h3>
                  </div>
                  <motion.button
                    onClick={() => handleAutoFetchToggle(!autoFetchEnabled)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-7 rounded-full transition-all flex items-center ${
                      autoFetchEnabled
                        ? 'bg-emerald-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      animate={{ x: autoFetchEnabled ? '24px' : '2px' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-6 h-6 bg-white rounded-full shadow"
                    />
                  </motion.button>
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  When enabled, new orders from v-it.netlify.app will automatically be added to your inventory.
                </p>
                
                {/* Manual Sync Button */}
                <motion.button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isSyncing ? 'Syncing...' : 'Sync Now from v-it'}
                </motion.button>

                {/* Sync Status Message */}
                {syncMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-3 text-xs font-medium flex items-center gap-2 ${
                      syncStatus === 'success'
                        ? 'text-emerald-700'
                        : syncStatus === 'error'
                        ? 'text-red-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {syncStatus === 'success' && <CheckCircle className="w-4 h-4" />}
                    {syncStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                    {syncMessage}
                  </motion.div>
                )}
              </motion.div>

              {/* Sign Out Button */}
              <motion.button
                onClick={handleSignOut}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </motion.button>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
