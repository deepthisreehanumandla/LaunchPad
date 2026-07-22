'use client';

import { FormEvent, useState } from 'react';
import { TextField } from '@/components/ui/TextField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { SelectField } from '@/components/ui/SelectField';
import { TagInput } from '@/components/ui/TagInput';
import { Button } from '@/components/ui/Button';
import { FormErrors } from '@/components/ui/FormErrors';
import { getErrorMessages } from '@/lib/api/errors';
import { PROJECT_CATEGORY_OPTIONS, PROJECT_PURPOSE_OPTIONS } from '@/lib/validation/projectConstants';
import type { CreateProjectInput, Project, ProjectCategory, ProjectPurpose } from '@/types/project';

interface ProjectFormProps {
  initialValues?: Partial<CreateProjectInput>;
  submitLabel: string;
  onSubmit: (input: CreateProjectInput) => Promise<Project>;
}

function toDateInputValue(iso?: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function ProjectForm({ initialValues, submitLabel, onSubmit }: ProjectFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [shortDescription, setShortDescription] = useState(initialValues?.shortDescription ?? '');
  const [detailedDescription, setDetailedDescription] = useState(
    initialValues?.detailedDescription ?? '',
  );
  const [category, setCategory] = useState<ProjectCategory>(initialValues?.category ?? 'startup');
  const [purpose, setPurpose] = useState<ProjectPurpose>(initialValues?.purpose ?? 'team-formation');
  const [techStack, setTechStack] = useState<string[]>(initialValues?.techStack ?? []);
  const [requiredSkills, setRequiredSkills] = useState<string[]>(initialValues?.requiredSkills ?? []);
  const [teamSize, setTeamSize] = useState(initialValues?.teamSize?.toString() ?? '1');
  const [deadline, setDeadline] = useState(toDateInputValue(initialValues?.deadline));
  const [bannerImage, setBannerImage] = useState(initialValues?.bannerImage ?? '');
  const [githubUrl, setGithubUrl] = useState(initialValues?.githubUrl ?? '');
  const [liveDemoUrl, setLiveDemoUrl] = useState(initialValues?.liveDemoUrl ?? '');

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        shortDescription,
        detailedDescription,
        category,
        purpose,
        techStack,
        requiredSkills: purpose === 'team-formation' ? requiredSkills : [],
        teamSize: Number(teamSize),
        deadline: deadline || undefined,
        bannerImage: bannerImage || undefined,
        githubUrl: githubUrl || undefined,
        liveDemoUrl: liveDemoUrl || undefined,
      });
    } catch (err) {
      setErrors(getErrorMessages(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="-mt-1 text-sm font-semibold uppercase tracking-wide text-neutral-400">Basics</h2>
      <TextField
        label="Project title"
        name="title"
        required
        minLength={3}
        maxLength={150}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <TextField
        label="Short description"
        name="shortDescription"
        required
        minLength={10}
        maxLength={250}
        value={shortDescription}
        onChange={(e) => setShortDescription(e.target.value)}
        placeholder="A one-line summary shown on project cards"
      />

      <TextAreaField
        label="Detailed description"
        name="detailedDescription"
        required
        minLength={20}
        maxLength={5000}
        value={detailedDescription}
        onChange={(e) => setDetailedDescription(e.target.value)}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SelectField
          label="Category"
          name="category"
          options={PROJECT_CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value as ProjectCategory)}
        />
        <SelectField
          label="Project purpose"
          name="purpose"
          options={PROJECT_PURPOSE_OPTIONS}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value as ProjectPurpose)}
        />
      </div>

      <p className="-mt-3 text-xs text-neutral-500">
        Projects with the purpose &ldquo;Looking for Team Members&rdquo; will be listed in the
        Marketplace. Personal Projects will only appear on your profile and My Projects.
      </p>
      </div>

      <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="-mt-1 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Tech &amp; team
      </h2>
      <TagInput label="Tech stack" value={techStack} onChange={setTechStack} placeholder="e.g. React" />

      {purpose === 'team-formation' && (
        <TagInput
          label="Required skills"
          value={requiredSkills}
          onChange={setRequiredSkills}
          placeholder="e.g. UI Design"
        />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          label="Team size"
          name="teamSize"
          type="number"
          min={1}
          max={50}
          required
          value={teamSize}
          onChange={(e) => setTeamSize(e.target.value)}
        />
        <TextField
          label="Deadline (optional)"
          name="deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>
      </div>

      <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="-mt-1 text-sm font-semibold uppercase tracking-wide text-neutral-400">Links</h2>
      <TextField
        label="Banner image URL (optional)"
        name="bannerImage"
        type="url"
        value={bannerImage}
        onChange={(e) => setBannerImage(e.target.value)}
        placeholder="https://…"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          label="GitHub repository URL (optional)"
          name="githubUrl"
          type="url"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/…"
        />
        <TextField
          label="Live demo URL (optional)"
          name="liveDemoUrl"
          type="url"
          value={liveDemoUrl}
          onChange={(e) => setLiveDemoUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>
      </div>

      <FormErrors messages={errors} />

      <Button type="submit" isLoading={isSubmitting} className="w-fit">
        {submitLabel}
      </Button>
    </form>
  );
}
