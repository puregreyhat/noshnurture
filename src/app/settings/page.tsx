'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LogOut, Download, CheckCircle, AlertCircle, Bell, Clock, Mail, Zap, Settings as SettingsIcon, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getSettings, saveSettings } from '@/lib/settings';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();



  // Test email
  const [isSendingSample, setIsSendingSample] = useState(false);
  const [isSendingReal, setIsSendingReal] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Notification preferences
  const [notificationTime, setNotificationTime] = useState('07:00');
  const [enableEmail, setEnableEmail] = useState(true);
  const [enablePush, setEnablePush] = useState(false);
  const [notifStatus, setNotifStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [notifMessage, setNotifMessage] = useState('');
  const [isSendingTestNotif, setIsSendingTestNotif] = useState(false);
  const [isSendingDemoExpiry, setIsSendingDemoExpiry] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load settings on mount

  useEffect(() => {
    try {
      const settings = getSettings();


      // Load preferences immediately
      loadNotificationPreferences();

      // Also reload after 2 seconds to catch any async updates
      const refreshTimer = setTimeout(() => {
        loadNotificationPreferences();
      }, 2000);



      return () => clearTimeout(refreshTimer);
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      const res = await fetch('/api/user/preferences');
      if (res.ok) {
        const data = await res.json();
        setNotificationTime(data.notification_time || '07:00');
        setEnableEmail(data.enable_email ?? true);
        setEnablePush(data.enable_push ?? false);
      } else {
        console.warn('[Settings] Failed to load preferences:', res.status);
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
  const handleToggleNotification = async (channel: 'email' | 'push', enabled: boolean) => {
    const updates: any = {};

    if (channel === 'email') {
      setEnableEmail(enabled);
      updates.enable_email = enabled;
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



  // Send test browser notification
  const handleTestNotification = async () => {
    setIsSendingTestNotif(true);
    setNotifStatus('idle');

    try {
      if (!('Notification' in window)) {
        setNotifStatus('error');
        setNotifMessage('Browser does not support notifications');
        return;
      }

      if (Notification.permission === 'denied') {
        setNotifStatus('error');
        setNotifMessage('Notification permission denied. Enable in browser settings.');
        return;
      }

      if (Notification.permission !== 'granted') {
        setNotifStatus('error');
        setNotifMessage('Please enable browser notifications first');
        return;
      }

      // Try Service Worker first (most compatible on mobile)
      let notificationSent = false;
      if ('serviceWorker' in navigator) {
        try {
          // Always try to register fresh
          const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          console.log('SW registered:', registration);

          // Wait briefly for activation
          await new Promise(resolve => setTimeout(resolve, 500));

          if (registration.active || registration.installing || registration.waiting) {
            await registration.showNotification('🍲 NoshNurture Test', {
              body: 'Test notification working! You will receive expiry alerts like this.',
              icon: '/icon.png',
              badge: '/badge.png',
              tag: 'test-notification',
              requireInteraction: false,
            });
            console.log('Notification sent via SW');
            notificationSent = true;
          }
        } catch (swError) {
          console.warn('SW notification failed:', swError);
        }
      }

      // Fallback to constructor
      if (!notificationSent) {
        try {
          const notification = new Notification('🍲 NoshNurture Test', {
            body: 'Test notification working! You will receive expiry alerts like this.',
            icon: '/icon.png',
            badge: '/badge.png',
            tag: 'test-notification',
          });
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
          console.log('Notification sent via constructor');
          notificationSent = true;
        } catch (constructorError) {
          console.error('Constructor notification failed:', constructorError);
        }
      }

      if (notificationSent) {
        setNotifStatus('success');
        setNotifMessage('✓ Browser notification sent!');
      } else {
        setNotifStatus('error');
        setNotifMessage('Could not send notification');
      }
    } catch (error) {
      console.error('Notification error:', error);
      setNotifStatus('error');
      setNotifMessage(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSendingTestNotif(false);
      setTimeout(() => setNotifStatus('idle'), 4000);
    }
  };

  // Trigger actual expiry reminder manually (uses real data)
  const handleSendRealReminder = async () => {
    if (!user) return;

    setIsSendingDemoExpiry(true);
    setNotifStatus('idle');
    setNotifMessage('');

    try {
      const res = await fetch('/api/notifications/test-reminder', {
        method: 'POST',
      });

      const json = await res.json();
      console.log('[Settings] Reminder response:', JSON.stringify(json, null, 2));

      if (res.ok) {
        const stats = json.stats || {};
        const emailsSent = stats.emailsSent ?? 0;
        console.log('[Settings] Parsed stats:', JSON.stringify({ emailsSent, totalItems }, null, 2));
        console.log('[Settings] Current UI state:', JSON.stringify({ enableEmail }, null, 2));

        if (totalItems === 0) {
          setNotifStatus('error');
          setNotifMessage('No items expiring in the next 7 days');
        } else {
          setNotifStatus('success');
          setNotifMessage(`✓ Sent ${totalItems} items! Email: ${emailsSent}`);

          // Send browser notification if enabled
          const browserNotif = stats.browserNotif ?? false;
          if (browserNotif && enablePush && Notification.permission === 'granted') {
            try {
              console.log('[Settings] Sending browser notification...');
              if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration && registration.active) {
                  await registration.showNotification('🍲 NoshNurture Expiry Alert', {
                    body: `${totalItems} items expiring in the next 7 days. Check your inventory!`,
                    icon: '/icon.png',
                    badge: '/badge.png',
                    tag: 'expiry-alert',
                  });
                  console.log('[Settings] ✓ Browser notification sent');
                }
              }
            } catch (e) {
              console.warn('[Settings] Browser notification failed:', e);
            }
          }
        }
      } else {
        setNotifStatus('error');
        setNotifMessage(json?.error || 'Failed to send reminders');
      }
    } catch (error) {
      setNotifStatus('error');
      setNotifMessage('Failed to trigger reminders');
    } finally {
      setIsSendingDemoExpiry(false);
      setTimeout(() => setNotifStatus('idle'), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] px-4 py-8 relative overflow-hidden font-['Poppins']">
      {/* Animated background blurs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-10 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-10 w-72 h-72 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -25, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 w-72 h-72 bg-stone-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-700 font-medium mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="w-14 h-14 rounded-2xl bg-emerald-900 flex items-center justify-center shadow-lg shadow-emerald-900/10"
            >
              <SettingsIcon className="w-7 h-7 text-emerald-50" />
            </motion.div>

            <div>
              <h1 className="text-4xl font-serif font-bold text-stone-800">
                Settings
              </h1>
              <p className="text-stone-500 mt-1 font-light">Customize your NoshNurture experience</p>
            </div>
          </div>
        </motion.div>

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="lg:col-span-1"
            >
              {/* Profile Card */}
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-white to-emerald-50/30 border-2 border-transparent bg-clip-padding rounded-3xl p-6 shadow-lg shadow-emerald-100/50 mb-6 relative overflow-hidden"
                style={{
                  backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                }}
              >
                {/* Decorative gradient orb */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-amber-400/20 rounded-full blur-2xl" />

                <div className="flex flex-col items-center text-center relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 mb-4 border-4 border-white"
                  >
                    <span className="text-5xl font-serif font-bold text-white">
                      {user.email?.charAt(0).toUpperCase() || '👤'}
                    </span>
                  </motion.div>

                  <h2 className="text-2xl font-serif font-bold bg-gradient-to-r from-stone-800 to-emerald-700 bg-clip-text text-transparent mb-1">
                    {user.email?.split('@')[0] || 'User'}
                  </h2>
                  <p className="text-sm text-stone-500 mb-6 font-light">{user.email}</p>

                  <div className="w-full pt-4 border-t border-stone-200 space-y-3">
                    <Link
                      href="/survey"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 text-sm font-bold transition-all shadow-sm hover:shadow-md"
                    >
                      <span>📝</span>
                      Help Improve NoshNurture
                    </Link>
                    <Link
                      href="/_debug/nosh"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-300 text-sm font-bold transition-all shadow-sm hover:shadow-md"
                    >
                      <Zap className="w-4 h-4" />
                      QA Panel
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Sign Out Card */}
              <motion.button
                onClick={handleSignOut}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-stone-800 text-stone-50 rounded-2xl hover:bg-stone-900 transition-all font-medium shadow-lg shadow-stone-900/10"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </motion.button>
            </motion.div>

            {/* Right Column - Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Notification Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                whileHover={{ y: -3 }}
                className="bg-gradient-to-br from-white via-white to-sky-50/30 border border-sky-100 rounded-3xl p-8 shadow-lg shadow-sky-100/50 relative overflow-hidden"
              >
                {/* Decorative gradient orb */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-sky-300/20 to-emerald-300/20 rounded-full blur-3xl" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200"
                    >
                      <Bell className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-serif font-bold bg-gradient-to-r from-stone-800 to-emerald-700 bg-clip-text text-transparent">Notifications</h3>
                      <p className="text-sm text-stone-500 font-light">Choose how you want to be notified</p>
                    </div>
                  </div>
                  {(enableEmail || enablePush) && (
                    <motion.button
                      onClick={handleSendRealReminder}
                      disabled={isSendingDemoExpiry}
                      whileHover={{ scale: 1.08, rotate: 2 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 disabled:from-stone-200 disabled:to-stone-300 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-amber-200"
                    >
                      <span className="text-base">🚨</span>
                      {isSendingDemoExpiry ? 'Sending...' : 'Test Alert'}
                    </motion.button>
                  )}
                </div>

                {/* Notification Time */}
                <div className="mb-8 p-6 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-stone-400" />
                    <label className="text-sm font-bold text-stone-700 uppercase tracking-wide">Daily Reminder Time</label>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="time"
                      value={notificationTime}
                      onChange={(e) => handleNotificationTimeChange(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none bg-white text-stone-800 font-medium text-lg transition-all"
                    />
                    <p className="text-xs text-stone-500 max-w-[200px] leading-relaxed">
                      We'll check your pantry and send alerts at this time every day.
                    </p>
                  </div>
                </div>



                <div className="space-y-4">
                  {/* Email Toggle */}
                  <motion.div
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between p-5 bg-white rounded-2xl border border-stone-100 hover:border-emerald-100 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-stone-800">Email Notifications</p>
                        <p className="text-sm text-stone-500 font-light">Daily reminders via email</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => handleToggleNotification('email', !enableEmail)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-14 h-8 rounded-full transition-all flex items-center shadow-inner ${enableEmail ? 'bg-emerald-600' : 'bg-stone-200'
                        }`}
                    >
                      <motion.div
                        animate={{ x: enableEmail ? '26px' : '2px' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-7 h-7 bg-white rounded-full shadow-sm"
                      />
                    </motion.button>
                  </motion.div>



                  {/* Push Notification Toggle */}
                  <motion.div
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between p-5 bg-white rounded-2xl border border-stone-100 hover:border-amber-100 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400">
                        <Bell className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-stone-800">Browser Notifications</p>
                        <p className="text-sm text-stone-500 font-light">Push alerts on this device</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {enablePush && (
                        <motion.button
                          onClick={handleTestNotification}
                          disabled={isSendingTestNotif}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Send test notification"
                          className="w-10 h-10 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 disabled:bg-stone-50 disabled:text-stone-300 flex items-center justify-center transition-all border border-amber-100"
                        >
                          <span className="text-lg">🔔</span>
                        </motion.button>
                      )}

                      {!enablePush ? (
                        <motion.button
                          onClick={handleEnablePush}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-5 py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-sm font-bold shadow-md shadow-stone-200 transition-all"
                        >
                          Enable
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={() => handleToggleNotification('push', !enablePush)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-14 h-8 rounded-full transition-all flex items-center shadow-inner ${enablePush ? 'bg-amber-500' : 'bg-stone-200'
                            }`}
                        >
                          <motion.div
                            animate={{ x: enablePush ? '26px' : '2px' }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="w-7 h-7 bg-white rounded-full shadow-sm"
                          />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Toast Notification */}
              <AnimatePresence>
                {toast && (
                  <motion.div
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 20, x: '-50%' }}
                    className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-50 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
                      }`}
                  >
                    {toast.type === 'success' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <span className="font-medium">{toast.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
