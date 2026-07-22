'use client';

import { KeyboardEvent, useState } from 'react';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ label, value, onChange, placeholder, maxTags = 30 }: TagInputProps) {
  const [draft, setDraft] = useState('');

  function commitDraft() {
    const tag = draft.trim();
    if (!tag) return;
    if (value.includes(tag)) {
      setDraft('');
      return;
    }
    if (value.length >= maxTags) return;
    onChange([...value, tag]);
    setDraft('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitDraft();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-2.5 pr-1.5 text-sm text-brand-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-brand-500 transition hover:bg-brand-100 hover:text-brand-700"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 border-none py-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />
      </div>
      <p className="text-xs text-neutral-400">Press Enter or comma to add a tag.</p>
    </div>
  );
}
