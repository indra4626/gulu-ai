// src/components/AuthScreen.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
        });
        if (err) throw err;
        if (data.user && !data.session) {
          setSuccess('Check your email for the confirmation link! Then come back and login.');
        } else if (data.session) {
          onAuth(data.session, password);
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
        onAuth(data.session, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-sm w-full">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-violet-600 to-blue-600 flex items-center justify-center text-3xl shadow-lg">
            🤖
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-400">
            GULU
          </h1>
          <p className="text-slate-500 text-sm mt-1">Your Private AI Companion</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn size={14} /> Login
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus size={14} /> Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
              required
              minLength={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-slate-200 text-sm focus:outline-none focus:border-violet-500"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className="text-red-400 text-xs px-1">{error}</p>}
          {success && <p className="text-green-400 text-xs px-1">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>{mode === 'login' ? 'Login' : 'Create Account'} <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-slate-600 text-xs">
          <ShieldCheck size={12} />
          <span>End-to-end encrypted • Your password = your key</span>
        </div>
      </div>
    </div>
  );
}
