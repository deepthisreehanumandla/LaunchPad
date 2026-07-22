import Link from 'next/link';

const PRODUCT_LINKS = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/register', label: 'Create a project' },
  { href: '/login', label: 'Log in' },
];

export function AppFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link href="/" className="flex w-fit items-center gap-2 text-base font-semibold text-neutral-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500 text-xs font-bold text-white">
              L
            </span>
            LaunchPad
          </Link>
          <p className="max-w-xs text-sm text-neutral-500">
            Where student builders find teammates, ship projects, and show their work.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Product</p>
          <ul className="flex flex-col gap-2">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-neutral-600 transition hover:text-brand-600">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-100">
        <div className="mx-auto flex max-w-6xl flex-col-reverse items-center justify-between gap-3 px-6 py-5 text-xs text-neutral-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} LaunchPad. Built by students, for students.</p>
        </div>
      </div>
    </footer>
  );
}
