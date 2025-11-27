'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Download, CheckCircle, AlertCircle, Bell, Clock, Mail, Zap, Settings as SettingsIcon, Shield, User } from 'lucide-react';
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

  // Test email
  const [isSendingSample, setIsSendingSample] = useState(false);
  const [isSendingReal, setIsSendingReal] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Notification preferences
  const [notificationTime, setNotificationTime] = useState('07:00');
  const [enableEmail, setEnableEmail] = useState(true);
  const [enableTelegram, setEnableTelegram] = useState(false);
  const [enablePush, setEnablePush] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [notifStatus, setNotifStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [notifMessage, setNotifMessage] = useState('');

  // Load settings on mount
  useEffect(() => {
    try {
      const settings = getSettings();
      setAutoFetchEnabled(settings.autoFetchVkartOrders || false);
      loadNotificationPreferences();
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }, []);

  // Load notification preferences from database
  const loadNotificationPreferences = async () => {
    try {
      const res = await fetch('/api/user/preferences');
      if (res.ok) {
        const data = await res.json();
        setNotificationTime(data.notification_time || '07:00');
        setEnableEmail(data.enable_email ?? true);
        setEnableTelegram(data.enable_telegram ?? false);
        setEnablePush(data.enable_push ?? false);
        setTelegramConnected(!!data.telegram_chat_id);
      }
    } catch (err) {
      console.error('Error loading notification preferences:', err);
    }
  };

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

  // Send test email
  const handleSendTestEmail = async () => {
    if (!user) {
      setEmailStatus('error');
      setEmailMessage('Please sign in first');
      return;
    }

    setIsSendingSample(true);
    setEmailStatus('idle');
    setEmailMessage('');

    try {
      const res = await fetch('/api/test-email', { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        setEmailStatus('error');
        setEmailMessage(json?.error || 'Failed to send email');
        return;
      }

      setEmailStatus('success');
      setEmailMessage(`✓ Test email sent to ${user.email} — check your inbox (and spam folder)!`);
    } catch (error) {
      setEmailStatus('error');
      setEmailMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSendingSample(false);
      setTimeout(() => setEmailStatus('idle'), 6000);
    }
  };

  // Send real inventory email
  const handleSendRealEmail = async () => {
    if (!user) {
      setEmailStatus('error');
      setEmailMessage('Please sign in first');
      return;
    }

    setIsSendingReal(true);
    setEmailStatus('idle');
    setEmailMessage('');

    try {
      const res = await fetch('/api/send-real-expiry-email', { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        setEmailStatus('error');
        setEmailMessage(json?.error || json?.message || 'Failed');
        return;
      }

      setEmailStatus('success');
      setEmailMessage(`✓ Sent ${json.itemsIncluded || 0} expiring items to ${user.email}`);
    } catch (error) {
      setEmailStatus('error');
      setEmailMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSendingReal(false);
      setTimeout(() => setEmailStatus('idle'), 6000);
    }
  };

  // Save notification time
  const handleNotificationTimeChange = async (time: string) => {
    setNotificationTime(time);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_time: time }),
      });

      if (res.ok) {
        setNotifStatus('success');
        setNotifMessage(`✓ Notification time set to ${time}`);
        setTimeout(() => setNotifStatus('idle'), 3000);
      }
    } catch (err) {
      setNotifStatus('error');
      setNotifMessage('Failed to save time');
    }
  };

  // Toggle notification channels
  const handleToggleNotification = async (channel: 'email' | 'telegram' | 'push', enabled: boolean) => {
    const updates: any = {};

    if (channel === 'email') {
      setEnableEmail(enabled);
      updates.enable_email = enabled;
    } else if (channel === 'telegram') {
      setEnableTelegram(enabled);
      updates.enable_telegram = enabled;
    } else if (channel === 'push') {
      setEnablePush(enabled);
      updates.enable_push = enabled;
    }

    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error updating notification preference:', err);
    }
  };

  // Connect Telegram
  const handleConnectTelegram = () => {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'noshnurture_bot';
    const userId = user?.id || '';
    window.open(`https://t.me/${botUsername}?start=${userId}`, '_blank');
  };

  // Disconnect Telegram
  const handleDisconnectTelegram = async () => {
    try {
      const res = await fetch('/api/telegram/connect', { method: 'DELETE' });
      if (res.ok) {
        setTelegramConnected(false);
        setEnableTelegram(false);
        setNotifStatus('success');
        setNotifMessage('✓ Telegram disconnected');
        setTimeout(() => setNotifStatus('idle'), 3000);
      }
    } catch (err) {
      setNotifStatus('error');
      setNotifMessage('Failed to disconnect');
    }
  };

  // Request push notification permission
  const handleEnablePush = async () => {
    if (!('Notification' in window)) {
      setNotifStatus('error');
      setNotifMessage('Browser does not support notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setEnablePush(true);
      handleToggleNotification('push', true);
      setNotifStatus('success');
      setNotifMessage('✓ Push notifications enabled');
      setTimeout(() => setNotifStatus('idle'), 3000);
    } else {
      setNotifStatus('error');
      setNotifMessage('Permission denied');
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

              {/* QA Panel Link */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.72, duration: 0.5 }}
                className="mb-6"
              >
                <Link
                  href="/_debug/nosh"
                  className="inline-block px-4 py-2 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-sm font-semibold"
                >
                  Open QA Panel (Hey Nosh)
                </Link>
              </motion.div>

              {/* Test Email Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.74, duration: 0.5 }}
                className="mb-8 p-4 bg-blue-50/50 border border-blue-200 rounded-xl"
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-2">📧 Email Reminders</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Test the email system with sample or real inventory data.
                </p>

                <div className="flex gap-2">
                  <motion.button
                    onClick={handleSendTestEmail}
                    disabled={isSendingSample}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-all"
                  >
                    {isSendingSample ? 'Sending...' : 'Sample Data'}
                  </motion.button>

                  <motion.button
                    onClick={handleSendRealEmail}
                    disabled={isSendingReal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-all"
                  >
                    {isSendingReal ? 'Sending...' : 'Real Inventory'}
                  </motion.button>
                </div>

                {emailMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-3 text-xs font-medium flex items-start gap-2 ${emailStatus === 'success'
                        ? 'text-emerald-700'
                        : emailStatus === 'error'
                          ? 'text-red-700'
                          : 'text-gray-700'
                      }`}
                  >
                    {emailStatus === 'success' && <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    {emailStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{emailMessage}</span>
                  </motion.div>
                )}
              </motion.div>

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
                    className={`w-12 h-7 rounded-full transition-all flex items-center ${autoFetchEnabled
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
                    className={`mt-3 text-xs font-medium flex items-center gap-2 ${syncStatus === 'success'
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

              {/* Notification Settings Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.76, duration: 0.5 }}
                className="mb-8 p-6 bg-gradient-to-br from-purple-50/80 to-blue-50/80 border border-purple-200 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">Notification Preferences</h3>
                </div>

                {/* Notification Time */}
                <div className="mb-6 p-4 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <label className="text-sm font-semibold text-gray-900">Reminder Time</label>
                  </div>
                  <input
                    type="time"
                    value={notificationTime}
                    onChange={(e) => handleNotificationTimeChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:outline-none bg-white text-gray-900 font-medium"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Choose what time you want to receive daily expiry reminders
                  </p>
                </div>

                {/* Email Toggle */}
                <div className="flex items-center justify-between mb-4 p-3 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Email Notifications</p>
                      <p className="text-xs text-gray-600">Daily reminders via email</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => handleToggleNotification('email', !enableEmail)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-7 rounded-full transition-all flex items-center ${enableEmail ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                  >
                    <motion.div
                      animate={{ x: enableEmail ? '24px' : '2px' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-6 h-6 bg-white rounded-full shadow"
                    />
                  </motion.button>
                </div>

                {/* Telegram Toggle */}
                <div className="flex items-center justify-between mb-4 p-3 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✈️</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900"> Notifications</p>
                      <p className="text-xs text-gray-600">
                        {telegramConnected ? 'Connected ✓' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!telegramConnected ? (
                      <motion.button
                        onClick={handleConnectTelegram}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Connect
                      </motion.button>
                    ) : (
                      <>
                        <motion.button
                          onClick={() => handleToggleNotification('telegram', !enableTelegram)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-12 h-7 rounded-full transition-all flex items-center ${enableTelegram ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                        >
                          <motion.div
                            animate={{ x: enableTelegram ? '24px' : '2px' }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="w-6 h-6 bg-white rounded-full shadow"
                          />
                        </motion.button>
                        <motion.button
                          onClick={handleDisconnectTelegram}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold"
                        >
                          Disconnect
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>

                {/* Push Notifications Toggle */}
                <div className="flex items-center justify-between mb-4 p-3 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔔</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Browser Notifications</p>
                      <p className="text-xs text-gray-600">Real-time push notifications</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => enablePush ? handleToggleNotification('push', false) : handleEnablePush()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-7 rounded-full transition-all flex items-center ${enablePush ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                  >
                    <motion.div
                      animate={{ x: enablePush ? '24px' : '2px' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-6 h-6 bg-white rounded-full shadow"
                    />
                  </motion.button>
                </div>

                {/* Status Message */}
                {notifMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 text-xs font-medium flex items-center gap-2 ${notifStatus === 'success'
                        ? 'text-emerald-700'
                        : notifStatus === 'error'
                          ? 'text-red-700'
                          : 'text-gray-700'
                      }`}
                  >
                    {notifStatus === 'success' && <CheckCircle className="w-4 h-4" />}
                    {notifStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                    {notifMessage}
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
