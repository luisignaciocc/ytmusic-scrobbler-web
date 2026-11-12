import Link from "next/link";

import LogoutBtn from "./logout-btn";
import Music2Icon from "./music-icon";

const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="container flex h-14 items-center gap-4">
        <Link
          className="flex min-w-0 items-center gap-2.5 font-display font-semibold"
          href="/"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Music2Icon className="h-4 w-4" />
          </span>
          <span className="truncate">
            <span className="sm:hidden">Scrobbler</span>
            <span className="hidden sm:inline">
              Last.fm Scrobbler for YouTube Music
            </span>
          </span>
        </Link>
        <nav
          aria-label="Main"
          className="ml-auto flex items-center gap-1 sm:gap-2"
        >
          <Link
            href="/pricing"
            className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Pricing
          </Link>
          <LogoutBtn />
        </nav>
      </div>
    </header>
  );
};

export default Header;
