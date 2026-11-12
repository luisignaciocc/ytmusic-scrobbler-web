import Link from "next/link";

import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../../lib/support-contact";

const linkClass =
  "inline-flex min-h-10 items-center text-sm text-muted-foreground hover:text-foreground hover:underline";

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Last.fm Scrobbler for YouTube Music. An independent project, not
          affiliated with Google, YouTube or Last.fm.
        </p>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-6 gap-y-1"
        >
          <Link href="/pricing" className={linkClass}>
            Pricing
          </Link>
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <Link href="/terms" className={linkClass}>
            Terms
          </Link>
          <a href={SUPPORT_MAILTO} className={linkClass}>
            {SUPPORT_EMAIL}
          </a>
        </nav>
      </div>
    </footer>
  );
}
