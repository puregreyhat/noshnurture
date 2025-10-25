'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Leaf, Clock, Globe, Calendar, AlertTriangle, LogOut } from 'lucide-react';
import { getSettings, saveSettings, type AppSettings } from '@/lib/settings';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const CUISINES = ['Indian', 'Italian', 'Chinese', 'Mexican', 'Thai', 'Japanese', 'American', 'Mediterranean', 'French', 'Korean'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  function toggle<K extends keyof AppSettings>(key: K) {
    const next = { ...settings, [key]: !settings[key] } as AppSettings;
    setSettings(next);
    saveSettings({ [key]: next[key] } as Partial<AppSettings>);
    showSaved();
  }

  function toggleDiet(diet: keyof AppSettings['dietaryPreferences']) {
    const next = {
      ...settings,
      dietaryPreferences: {
        ...settings.dietaryPreferences,
        [diet]: !settings.dietaryPreferences[diet],
      },
    };
    setSettings(next);
    saveSettings({ dietaryPreferences: next.dietaryPreferences });
    showSaved();
  }

  function toggleCuisine(cuisine: string) {
    const cuisines = settings.recipeFilters.cuisine;
    const next = {
      ...settings,
      recipeFilters: {
        ...settings.recipeFilters,
        cuisine: cuisines.includes(cuisine)
          ? cuisines.filter(c => c !== cuisine)
          : [...cuisines, cuisine],
      },
    };
    setSettings(next);
    saveSettings({ recipeFilters: next.recipeFilters });
    showSaved();
  }

  function toggleMealType(mealType: string) {
    const meals = settings.recipeFilters.mealType;
    const next = {
      ...settings,
      recipeFilters: {
        ...settings.recipeFilters,
        mealType: meals.includes(mealType)
          ? meals.filter(m => m !== mealType)
          : [...meals, mealType],
      },
    };
    setSettings(next);
    saveSettings({ recipeFilters: next.recipeFilters });
    showSaved();
  }

  function updateCookingTime(minutes: number) {
    const next = {
      ...settings,
      recipeFilters: {
        ...settings.recipeFilters,
        maxCookingTime: minutes,
      },
    };
    setSettings(next);
    saveSettings({ recipeFilters: next.recipeFilters });
    showSaved();
  }

  function updateWarningDays(days: number) {
    const next = {
      ...settings,
      expirySettings: {
        ...settings.expirySettings,
        warningDays: days,
      },
    };
    setSettings(next);
    saveSettings({ expirySettings: next.expirySettings });
    showSaved();
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  function togglePrioritizeExpiring() {
    const next = {
      ...settings,
      expirySettings: {
        ...settings.expirySettings,
        prioritizeExpiring: !settings.expirySettings.prioritizeExpiring,
      },
    };
    setSettings(next);
    saveSettings({ expirySettings: next.expirySettings });
    showSaved();
  }

  function toggleAutoFetchVkart() {
    const next = {
      ...settings,
      autoFetchVkartOrders: !settings.autoFetchVkartOrders,
    } as AppSettings;
    setSettings(next);
    saveSettings({ autoFetchVkartOrders: next.autoFetchVkartOrders });
    showSaved();
  }

  function showSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">⚙️ Settings</h1>
          {saved && (
            <span className="text-sm px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full font-medium animate-pulse">
              ✓ Saved
            </span>
          )}
        </div>

        <div className="space-y-6">
          {/* AI Features */}
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🤖 AI Features</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">On-device ingredient embeddings</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Use TensorFlow.js to normalize ingredient names (e.g., &quot;tomatoes&quot; = &quot;tomato&quot;). No API needed.
                  </p>
                </div>
                <button
                  onClick={() => toggle('useSemanticNormalization')}
                  className={`ml-4 w-14 h-8 rounded-full transition-all ${
                    settings.useSemanticNormalization ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                      settings.useSemanticNormalization ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Local AI recipe generator (Beta)</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Experimental: Run recipes through local TFJS model if available.
                  </p>
                </div>
                <button
                  onClick={() => toggle('useLocalAIGenerator')}
                  className={`ml-4 w-14 h-8 rounded-full transition-all ${
                    settings.useLocalAIGenerator ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                      settings.useLocalAIGenerator ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>
            </div>
          </div>

          {/* Dietary Preferences */}
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Dietary Preferences</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Filter recipes based on your dietary needs</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(settings.dietaryPreferences).map((diet) => {
                const key = diet as keyof AppSettings['dietaryPreferences'];
                const active = settings.dietaryPreferences[key];
                return (
                  <button
                    key={diet}
                    onClick={() => toggleDiet(key)}
                    className={`p-3 rounded-xl border-2 transition-all font-medium ${
                      active
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-green-300'
                    }`}
                  >
                    {active && '✓ '}
                    {diet.replace(/([A-Z])/g, ' $1').trim()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipe Filters */}
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Recipe Filters</h2>
            </div>

            {/* Cooking Time */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-800">Max Cooking Time</h3>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  {settings.recipeFilters.maxCookingTime === 0
                    ? 'No limit'
                    : `${settings.recipeFilters.maxCookingTime} mins`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="15"
                value={settings.recipeFilters.maxCookingTime}
                onChange={(e) => updateCookingTime(Number(e.target.value))}
                className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>No limit</span>
                <span>15m</span>
                <span>30m</span>
                <span>60m</span>
                <span>120m</span>
              </div>
            </div>

            {/* Cuisines */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Preferred Cuisines</h3>
              <p className="text-xs text-gray-500 mb-3">Leave empty to see all cuisines</p>
              <div className="flex flex-wrap gap-2">
                {CUISINES.map((cuisine) => {
                  const active = settings.recipeFilters.cuisine.includes(cuisine);
                  return (
                    <button
                      key={cuisine}
                      onClick={() => toggleCuisine(cuisine)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        active
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                      }`}
                    >
                      {active && '✓ '}
                      {cuisine}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meal Types */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-800">Meal Types</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">Leave empty to see all meal types</p>
              <div className="flex flex-wrap gap-2">
                {MEAL_TYPES.map((meal) => {
                  const active = settings.recipeFilters.mealType.includes(meal);
                  return (
                    <button
                      key={meal}
                      onClick={() => toggleMealType(meal)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        active
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                      }`}
                    >
                      {active && '✓ '}
                      {meal}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Expiry Settings */}
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <h2 className="text-2xl font-bold text-gray-900">Expiry Alerts</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">Warning Days</h3>
                  <span className="text-sm font-bold text-amber-600">
                    {settings.expirySettings.warningDays} days
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Show items as &quot;expiring soon&quot; this many days before expiry
                </p>
                <input
                  type="range"
                  min="1"
                  max="14"
                  step="1"
                  value={settings.expirySettings.warningDays}
                  onChange={(e) => updateWarningDays(Number(e.target.value))}
                  className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 day</span>
                  <span>7 days</span>
                  <span>14 days</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Prioritize expiring items</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Show recipes that use expiring ingredients first
                  </p>
                </div>
                <button
                  onClick={togglePrioritizeExpiring}
                  className={`ml-4 w-14 h-8 rounded-full transition-all ${
                    settings.expirySettings.prioritizeExpiring ? 'bg-amber-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                      settings.expirySettings.prioritizeExpiring ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>
            </div>
          </div>

          {/* Sync / Integrations */}
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Sync & Integrations</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Auto-fetch Vkart orders</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    When enabled, NoshNurture will automatically fetch orders from Vkart (by your email) when you open the Scanner page. Disable to import manually only.
                  </p>
                </div>
                <button
                  onClick={toggleAutoFetchVkart}
                  className={`ml-4 w-14 h-8 rounded-full transition-all ${
                    settings.autoFetchVkartOrders ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                      settings.autoFetchVkartOrders ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">👤 Account</h2>
            <div className="space-y-4">
              {user && (
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Signed in as</p>
                  <p className="font-semibold text-gray-800">{user.email}</p>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold shadow-lg hover:shadow-xl"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <div className="bg-white/80 backdrop-blur-xl border border-red-100 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Settings</h2>
            <p className="text-sm text-gray-600 mb-4">
              Reset all settings to default values
            </p>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all settings?')) {
                  localStorage.removeItem('nosh_settings_v1');
                  window.location.reload();
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
