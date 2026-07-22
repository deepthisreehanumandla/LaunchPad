'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { usersApi } from '@/lib/api/users';
import { getErrorMessages } from '@/lib/api/errors';
import { TextField } from '@/components/ui/TextField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TagInput } from '@/components/ui/TagInput';
import { Button } from '@/components/ui/Button';
import { FormErrors } from '@/components/ui/FormErrors';
import { PageSpinner } from '@/components/ui/Spinner';
import type { UserProfile } from '@/types/user';

export default function EditProfilePage() {
  const router = useRouter();
  const { isReady, user } = useRequireAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [university, setUniversity] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    usersApi
      .getMe()
      .then((me) => {
        setProfile(me);
        setName(me.name);
        setProfilePicture(me.profilePicture ?? '');
        setUniversity(me.university ?? '');
        setBranch(me.branch ?? '');
        setGraduationYear(me.graduationYear?.toString() ?? '');
        setBio(me.bio ?? '');
        setSkills(me.skills);
        setInterests(me.interests);
        setGithub(me.socialLinks?.github ?? '');
        setLinkedin(me.socialLinks?.linkedin ?? '');
        setPortfolio(me.socialLinks?.portfolio ?? '');
      })
      .finally(() => setIsLoading(false));
  }, [isReady]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      await usersApi.updateMe({
        name,
        profilePicture: profilePicture || undefined,
        university: university || undefined,
        branch: branch || undefined,
        graduationYear: graduationYear ? Number(graduationYear) : undefined,
        bio: bio || undefined,
        skills,
        interests,
        socialLinks: {
          github: github || undefined,
          linkedin: linkedin || undefined,
          portfolio: portfolio || undefined,
        },
      });
      router.push(`/profile/${user?._id}`);
    } catch (err) {
      setErrors(getErrorMessages(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady || isLoading || !profile) {
    return <PageSpinner label="Loading…" />;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-neutral-900">Edit profile</h1>
      <p className="mb-8 text-sm text-neutral-500">
        This information helps other students find and evaluate you as a teammate.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6">
        <TextField
          label="Full name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <TextField
          label="Profile picture URL"
          name="profilePicture"
          type="url"
          value={profilePicture}
          onChange={(e) => setProfilePicture(e.target.value)}
          placeholder="https://…"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            label="University"
            name="university"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          />
          <TextField
            label="Branch"
            name="branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
        </div>

        <TextField
          label="Graduation Year"
          name="graduationYear"
          type="number"
          min={1950}
          max={2100}
          value={graduationYear}
          onChange={(e) => setGraduationYear(e.target.value)}
        />

        <TextAreaField
          label="Bio"
          name="bio"
          maxLength={500}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <TagInput label="Skills" value={skills} onChange={setSkills} placeholder="e.g. React" />
        <TagInput
          label="Interests"
          value={interests}
          onChange={setInterests}
          placeholder="e.g. Machine Learning"
        />

        <TextField
          label="GitHub"
          name="github"
          type="url"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          placeholder="https://github.com/…"
        />
        <TextField
          label="LinkedIn"
          name="linkedin"
          type="url"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          placeholder="https://linkedin.com/in/…"
        />
        <TextField
          label="Portfolio"
          name="portfolio"
          type="url"
          value={portfolio}
          onChange={(e) => setPortfolio(e.target.value)}
          placeholder="https://…"
        />

        <FormErrors messages={errors} />

        <Button type="submit" isLoading={isSubmitting} className="w-fit">
          Save changes
        </Button>
      </form>
    </main>
  );
}
