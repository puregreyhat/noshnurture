'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AssistantLinkPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');

  useEffect(() => {
    async function handleAccountLink() {
      try {
        if (!redirectUri || !state) {
          setError('Invalid request parameters');
          setLoading(false);
          return;
        }

        const supabase = createClient();
        
        // Check if user is already logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Authentication error');
          setLoading(false);
          return;
        }

        if (session?.access_token) {
          // User is already logged in, complete the linking
          completeLink(session.access_token);
        } else {
          // User needs to log in
          setLoading(false);
        }
      } catch (err) {
        console.error('Account link error:', err);
        setError('Something went wrong');
        setLoading(false);
      }
    }

    handleAccountLink();
  }, [redirectUri, state]);

  const completeLink = (accessToken: string) => {
    if (!redirectUri || !state) {
      setError('Missing redirect parameters');
      return;
    }

    // Build the redirect URL with the authorization code (access token)
    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set('code', accessToken);
    callbackUrl.searchParams.set('state', state);

    // Redirect back to Google Assistant
    window.location.href = callbackUrl.toString();
  };

  const handleSignIn = async () => {
    try {
      const supabase = createClient();
      
      // Get the current URL for redirect after sign in
      const currentUrl = window.location.href;
      
      // Redirect to sign in with return URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: currentUrl,
        },
      });

      if (error) {
        console.error('Sign in error:', error);
        setError('Failed to sign in');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Linking your account...</h2>
          <p className="text-gray-600 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.close()}
            className="mt-6 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎙️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Link Google Assistant
          </h1>
          <p className="text-gray-600">
            Connect your HeyNosh account to use voice commands with Google Assistant
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-emerald-600 text-sm">✓</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Add Items by Voice</p>
              <p className="text-sm text-gray-600">"Hey Google, add tomatoes to HeyNosh"</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-emerald-600 text-sm">✓</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Check Expiring Items</p>
              <p className="text-sm text-gray-600">"Hey Google, ask HeyNosh what's expiring"</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-emerald-600 text-sm">✓</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Get Recipe Ideas</p>
              <p className="text-sm text-gray-600">"Hey Google, ask HeyNosh for recipes"</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignIn}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
        >
          Sign In to Link Account
        </button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          By linking your account, you authorize Google Assistant to access your HeyNosh inventory.
        </p>
      </div>
    </div>
  );
}
