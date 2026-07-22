'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { getErrorMessages } from '@/lib/api/errors';
import { useAuthStore } from '@/lib/auth/tokenStore';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { FormErrors } from '@/components/ui/FormErrors';

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      const { user, accessToken } = await authApi.register({ name, email, password });
      setSession(accessToken, user);
      router.push('/profile/edit');
    } catch (err) {
      setErrors(getErrorMessages(err));
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

        <h1 className="text-center text-xl font-semibold text-neutral-900">Create your account</h1>
        <p className="mb-8 mt-1 text-center text-sm text-neutral-500">
          Join a community of student builders.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Full name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
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
            minLength={8}
            hint="At least 8 characters."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <FormErrors messages={errors} />

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Get started
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
