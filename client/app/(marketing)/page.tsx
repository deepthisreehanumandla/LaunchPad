import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { FolderIcon, MessageIcon, CheckIcon, UserIcon } from '@/components/ui/icons';

const FEATURES = [
  {
    icon: UserIcon,
    title: 'Find your team',
    description:
      'Post what you\u2019re building and the skills you need, or browse open projects looking for teammates like you.',
  },
  {
    icon: CheckIcon,
    title: 'Track the work',
    description:
      'A drag-and-drop task board keeps everyone aligned on what\u2019s next, who owns it, and what\u2019s overdue.',
  },
  {
    icon: MessageIcon,
    title: 'Chat in real time',
    description:
      'Every project gets a live team chat, so decisions happen in context \u2014 no more scattered group chats.',
  },
  {
    icon: FolderIcon,
    title: 'Showcase your work',
    description:
      'Your profile collects everything you\u2019ve built and contributed to, ready to share with recruiters.',
  },
];

const STEPS = [
  {
    title: 'Post or browse a project',
    description:
      'Share your idea with the skills you need, or explore the marketplace for one to join.',
  },
  {
    title: 'Build your team',
    description:
      'Review join requests and bring on teammates whose skills fit what you\u2019re building.',
  },
  {
    title: 'Ship it together',
    description: 'Coordinate with the task board and team chat, right inside the project.',
  },
];

export default function LandingPage() {
  return (
    <>
      <AppHeader />
      <main className="flex flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center"
          >
            <div className="h-[420px] w-[720px] rounded-full bg-brand-100/60 blur-3xl" />
          </div>

          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pb-20 pt-20 text-center sm:pt-28">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Built for student builders
            </span>

            <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-6xl">
              Build together.
              <br />
              <span className="text-brand-600">Launch faster.</span>
            </h1>

            <p className="max-w-xl text-balance text-lg leading-relaxed text-neutral-500">
              LaunchPad is where students find teammates, coordinate real projects, and turn side
              ideas into something worth showing off.
            </p>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="rounded-lg bg-brand-500 px-7 py-3 text-sm font-medium text-white shadow-xs transition hover:bg-brand-600"
              >
                Get Started
              </Link>
              <Link
                href="/marketplace"
                className="rounded-lg border border-neutral-300 bg-white px-7 py-3 text-sm font-medium text-neutral-800 transition hover:border-neutral-400"
              >
                Explore projects
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-neutral-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 flex flex-col gap-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                Everything in one place
              </p>
              <h2 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
                From finding a team to shipping the project
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-5 transition hover:border-brand-200 hover:shadow-soft"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
                  <p className="text-sm leading-relaxed text-neutral-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-neutral-50 py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-12 flex flex-col gap-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                How it works
              </p>
              <h2 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
                Three steps from idea to shipped
              </h2>
            </div>

            <ol className="flex flex-col gap-6">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-5 rounded-xl border border-neutral-200 bg-white p-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-neutral-200 bg-white py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-2xl border border-brand-100 bg-brand-50/60 px-8 py-12 text-center">
            <h2 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
              Ready to find your next project?
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-neutral-600">
              Create an account in under a minute and start building with people who want to build
              too.
            </p>
            <Link
              href="/register"
              className="rounded-lg bg-brand-500 px-7 py-3 text-sm font-medium text-white shadow-xs transition hover:bg-brand-600"
            >
              Create your account
            </Link>
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  );
}
