'use client';

import { useState } from 'react';
import { teamsApi } from '@/lib/api/teams';
import { getErrorMessages } from '@/lib/api/errors';
import { Button } from '@/components/ui/Button';

interface JoinRequestButtonProps {
  projectId: string;
  hasPendingRequest: boolean;
  onRequested: () => void;
}

export function JoinRequestButton({ projectId, hasPendingRequest, onRequested }: JoinRequestButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRequested, setJustRequested] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    setError(null);
    try {
      await teamsApi.sendJoinRequest(projectId);
      setJustRequested(true);
      onRequested();
    } catch (err) {
      setError(getErrorMessages(err)[0]);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (hasPendingRequest || justRequested) {
    return (
      <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-500">
        Request pending
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleClick} isLoading={isSubmitting}>
        Request to join
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
