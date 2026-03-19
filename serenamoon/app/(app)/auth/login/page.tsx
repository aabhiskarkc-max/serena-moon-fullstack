'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { login } from '@/api/auth';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/pricing";
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem("serena_token", data.access_token)
      toast.success("welcome back")
      router.replace(next)
    },
    onError: (error) => {
      toast.error(error.message)
    }

  })
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      email,
      password
    })

  };

  return (
    <div className="min-h-screen pt-12 pb-20 px-6 flex items-center justify-center relative overflow-hidden bg-white dark:bg-[#020617] transition-colors duration-500">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/50 dark:bg-slate-800/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-16">
          <span className="text-[10px] tracking-widest uppercase text-slate-400 dark:text-slate-500 block mb-6">Identity Verification</span>
          <h2 className="text-6xl font-serif italic text-slate-900 dark:text-slate-100">Welcome Back</h2>
        </div>

        <div className="pt-5 bg-white/80 dark:bg-[#050b14]/40 backdrop-blur-3xl border border-slate-200 dark:border-white/5 p-12 shadow-2xl rounded-sm">
          <form onSubmit={handleLogin} className="space-y-8 animate-in fade-in duration-700">
            <div className="space-y-2">
              <label className="text-[9px] tracking-widest uppercase text-slate-500 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-400 dark:focus:border-white/30 transition-all font-light text-sm"
                placeholder="name@ocean.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] tracking-widest uppercase text-slate-500 ml-1">Secret Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-400 dark:focus:border-white/30 transition-all font-light text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="cursor-pointer w-full bg-slate-900 dark:bg-white text-white dark:text-black py-5 uppercase text-[10px] tracking-[0.5em] font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all mt-4 disabled:opacity-50 active:scale-[0.98]"
            >
              {mutation.isPending ? 'Authenticating...' : 'Authenticate'}
            </button>
          </form>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] tracking-widest uppercase text-slate-400">
            Don&apos;t have an identity?{' '}
            <Link
              href="/auth/register"
              className="cursor-pointer text-blue-600 dark:text-cyan-400 hover:text-blue-400 dark:hover:text-white font-bold transition-colors ml-1"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}