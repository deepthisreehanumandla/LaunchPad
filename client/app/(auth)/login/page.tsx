'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { getErrorMessages } from '@/lib/api/errors';
import { useAuthStore } from '@/lib/auth/tokenStore';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { FormErrors } from '@/components/ui/FormErrors';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      const { user, accessToken } = await authApi.login({ email, password });
      setSession(accessToken, user);
      router.push('/marketplace');
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'INVALID_CREDENTIALS') {
        setErrors(['Incorrect email or password.']);
      } else {
        setErrors(getErrorMessages(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
      <div className="w-full max-w-sm animate-fadeInUp rounded-2xl border border-neutral-200 bg-white p-8 shadow-card">
        <Link href="/" className="mx-auto mb-6 flex w-fit items-center gap-2 text-base font-semibold text-neutral-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-xs font-bold text-white">
            L
          </span>
          LaunchPad
        </Link>

        <h1 className="text-center text-xl font-semibold text-neutral-900">Welcome back</h1>
        <p className="mb-8 mt-1 text-center text-sm text-neutral-500">Log in to keep building.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <FormErrors messages={errors} />

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-brand-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
