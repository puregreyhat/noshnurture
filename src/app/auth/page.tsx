'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@/components/icons';
import Image from 'next/image';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError((err as Error)?.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError((err as Error)?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw error;

      setError('Check your email to confirm your account!');
      setTimeout(() => {
        setIsSignUp(false);
        setError('');
      }, 3000);
    } catch (err) {
      setError((err as Error)?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

      return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-6xl">
            <div className="relative rounded-3xl shadow-lg overflow-hidden ring-1 ring-black/5 bg-white">
              {/* Forms layer */}
              <div className="relative z-10 grid md:grid-cols-2">
                {/* Sign In column */}
                <div className={`${isSignUp ? 'hidden md:block' : 'block'} p-8 md:p-12`}>
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Sign In</h1>

                  {!isSignUp && error && !error.includes('Check your email') && (
                    <div className="mb-4 p-3 rounded-lg text-sm border bg-red-50 border-red-200 text-red-800">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-medium shadow-sm disabled:opacity-60"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="my-6">
                    <div className="flex items-center gap-4">
                      <div className="h-px bg-gray-200 flex-1" />
                      <span className="text-xs text-gray-500">Or use your email</span>
                      <div className="h-px bg-gray-200 flex-1" />
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-400"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60"
                    >
                      {isLoading ? 'Signing in...' : 'SIGN IN'}
                    </button>
                  </form>

                  {/* Mobile toggle */}
                  <div className="md:hidden mt-6 text-center">
                    <p className="text-gray-600">
                      Don&apos;t have an account?{' '}
                      <button onClick={() => setIsSignUp(true)} className="text-emerald-700 font-semibold hover:underline">
                        Sign Up
                      </button>
                    </p>
                  </div>
                </div>

                {/* Sign Up column */}
                <div className={`${isSignUp ? 'block' : 'hidden md:block'} p-8 md:p-12`}>
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Account</h1>

                  {isSignUp && error && (
                    <div className={`mb-4 p-3 rounded-lg text-sm border ${error.includes('Check your email') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-medium shadow-sm disabled:opacity-60"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="my-6">
                    <div className="flex items-center gap-4">
                      <div className="h-px bg-gray-200 flex-1" />
                      <span className="text-xs text-gray-500">Or register with email</span>
                      <div className="h-px bg-gray-200 flex-1" />
                    </div>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-400"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-400"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60"
                    >
                      {isLoading ? 'Creating account...' : 'SIGN UP'}
                    </button>
                  </form>

                  {/* Mobile toggle */}
                  <div className="md:hidden mt-6 text-center">
                    <p className="text-gray-600">
                      Already have an account?{' '}
                      <button onClick={() => setIsSignUp(false)} className="text-emerald-700 font-semibold hover:underline">
                        Sign In
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              {/* Sliding overlay panel */}
              <div className="hidden md:block absolute inset-0 z-20 pointer-events-none">
                <div
                  className={`absolute top-0 left-0 h-full w-[52%] transition-all duration-700 ease-in-out will-change-transform ${isSignUp ? 'translate-x-0 rounded-r-[120px]' : 'translate-x-full rounded-l-[120px]'} bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex flex-col items-center justify-center p-12 shadow-none`}
                >
                  <div className="pointer-events-auto flex flex-col items-center text-center max-w-sm">
                    <Image 
                      src="/logo.png" 
                      alt="NoshNurture" 
                      width={120} 
                      height={120} 
                      className="mb-6"
                    />
                    <h2 className="text-3xl font-bold mb-2">{isSignUp ? 'Hello, Friend!' : 'Welcome Back!'}</h2>
                    <p className="text-emerald-50/90 mb-8">
                      {isSignUp
                        ? 'Register with your personal details to use all of site features'
                        : 'To keep connected with us please login with your personal info'}
                    </p>
                    <button
                      onClick={() => setIsSignUp((v) => !v)}
                      className="px-6 py-3 rounded-full border border-white/70 hover:border-white bg-white/10 hover:bg-white/20 font-semibold transition"
                    >
                      {isSignUp ? 'SIGN IN' : 'SIGN UP'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
