import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const PIN_HASH_KEY = 'gulu_pin_hash';
const SESSION_KEY = 'gulu_authenticated';

/**
 * Hash a PIN string using SHA-256.
 * We never store the raw PIN — only its hash.
 */
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_gulu_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function AuthGate({ children }) {
  const [state, setState] = useState('loading'); // loading | setup | login | authenticated
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(PIN_HASH_KEY);
    const session = sessionStorage.getItem(SESSION_KEY);

    if (!stored) {
      setState('setup'); // First time — create PIN
    } else if (session === 'true') {
      setState('authenticated'); // Already logged in this session
    } else {
      setState('login'); // Has PIN, needs to enter it
    }
  }, []);

  const handleSetup = async () => {
    setError('');
    if (pin.length < 4) {
      setError('PIN must be at least 4 characters');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    const hash = await hashPin(pin);
    localStorage.setItem(PIN_HASH_KEY, hash);
    sessionStorage.setItem(SESSION_KEY, 'true');
    setState('authenticated');
  };

  const handleLogin = async () => {
    setError('');
    const storedHash = localStorage.getItem(PIN_HASH_KEY);
    const inputHash = await hashPin(pin);

    if (inputHash === storedHash) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setState('authenticated');
    } else {
      setError('Wrong PIN. Try again.');
      setPin('');
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (state === 'authenticated') {
    return children;
  }

  // --- Setup / Login Screen ---
  const isSetup = state === 'setup';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center">

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-tr from-violet-600 to-blue-600 flex items-center justify-center shadow-lg">
          {isSetup ? <ShieldCheck size={30} className="text-white" /> : <Lock size={30} className="text-white" />}
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-slate-200 mb-1">
          {isSetup ? 'Create Your PIN' : 'Welcome Back'}
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          {isSetup
            ? 'Set a PIN to protect GULU. Only you can access her.'
            : 'Enter your PIN to unlock GULU.'}
        </p>

        {/* PIN Input */}
        <div className="relative mb-3">
          <input
            type={showPin ? 'text' : 'password'}
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isSetup && handleLogin()}
            placeholder={isSetup ? 'Create PIN (min 4 chars)' : 'Enter PIN'}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-slate-200 text-center text-lg tracking-widest focus:outline-none focus:border-violet-500"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Confirm PIN (setup only) */}
        {isSetup && (
          <input
            type={showPin ? 'text' : 'password'}
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSetup()}
            placeholder="Confirm PIN"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-center text-lg tracking-widest focus:outline-none focus:border-violet-500 mb-4"
          />
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm mb-3">{error}</p>
        )}

        {/* Button */}
        <button
          onClick={isSetup ? handleSetup : handleLogin}
          disabled={!pin}
          className="w-full mt-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 rounded-xl font-semibold text-white transition-all"
        >
          {isSetup ? 'Set PIN & Enter' : 'Unlock GULU'}
        </button>

        <p className="text-slate-600 text-xs mt-4">
          {isSetup
            ? '🔒 PIN is SHA-256 hashed. Never stored in plain text.'
            : '🔒 This is your personal GULU. Nobody else can access her.'}
        </p>
      </div>
    </div>
  );
}
