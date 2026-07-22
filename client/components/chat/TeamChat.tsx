'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { chatApi } from '@/lib/api/chat';
import { useSocket } from '@/lib/socket/useSocket';
import { useAuthStore } from '@/lib/auth/tokenStore';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageIcon } from '@/components/ui/icons';
import type { ChatMessage } from '@/types/chat';

interface TeamChatProps {
  projectId: string;
}

interface AckResponse {
  success: boolean;
  error?: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function TeamChat({ projectId }: TeamChatProps) {
  const currentUser = useAuthStore((state) => state.user);
  const socket = useSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load persisted history over REST.
  useEffect(() => {
    let cancelled = false;
    setIsLoadingHistory(true);
    setHistoryError(null);

    chatApi
      .listMessages(projectId)
      .then(({ messages: history }) => {
        if (!cancelled) setMessages(history);
      })
      .catch(() => {
        if (!cancelled) {
          setHistoryError('Only project members can view this chat.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Join the project's workspace room for the lifetime of this component,
  // and leave it cleanly on unmount / project change.
  useEffect(() => {
    if (!socket) return;

    setJoinError(null);
    socket.emit('workspace:join', { projectId }, (res: AckResponse) => {
      if (!res.success) setJoinError(res.error ?? 'Could not join this project\u2019s chat.');
    });

    return () => {
      socket.emit('workspace:leave', { projectId });
    };
  }, [socket, projectId]);

  // Live incoming messages.
  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(message: ChatMessage) {
      if (message.project !== projectId) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    }

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, projectId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !socket) return;

    setIsSending(true);
    socket.emit('message:send', { projectId, content }, (res: AckResponse) => {
      setIsSending(false);
      if (res.success) {
        setDraft('');
      } else {
        setHistoryError(res.error ?? 'Failed to send message.');
      }
    });
  }

  return (
    <section className="mb-8 flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <h2 className="border-b border-neutral-200 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Team chat
      </h2>

      <div ref={scrollRef} className="scrollbar-thin flex h-72 flex-col gap-3 overflow-y-auto px-5 py-4">
        {isLoadingHistory ? (
          <PageSpinner label="Loading chat…" />
        ) : historyError ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-neutral-400">{historyError}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              compact
              className="border-none bg-transparent"
              icon={<MessageIcon className="h-4 w-4" />}
              title="No messages yet"
              description="Say hello to the team."
            />
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender._id === currentUser?._id;
            return (
              <div key={message._id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                <span className="mb-0.5 text-xs text-neutral-400">
                  {isOwn ? 'You' : message.sender.name} &middot; {formatTime(message.createdAt)}
                </span>
                <span
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    isOwn
                      ? 'rounded-tr-sm bg-brand-500 text-white'
                      : 'rounded-tl-sm bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {message.content}
                </span>
              </div>
            );
          })
        )}
      </div>

      {joinError && (
        <p className="border-t border-neutral-200 bg-red-50 px-5 py-2 text-xs text-red-600">{joinError}</p>
      )}

      <form onSubmit={handleSend} className="flex gap-2 border-t border-neutral-200 p-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={socket ? 'Message the team…' : 'Connecting…'}
          disabled={!socket || isSending}
          maxLength={4000}
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-neutral-50"
        />
        <button
          type="submit"
          disabled={!socket || isSending || draft.trim().length === 0}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </section>
  );
}
