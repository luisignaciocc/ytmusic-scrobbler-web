import Link from "next/link";

import LastfmLogout from "./lastfm-logout";
import LogoutBtn from "./logout-btn";
import Music2Icon from "./music-icon";

const Header = () => {
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center top-0 sticky bg-[hsl(var(--background))] border-b">
      <Link className="flex items-center justify-center space-x-3" href="/">
        <Music2Icon className="h-6 w-6" />
        <p className="font-semibold hidden sm:block">
          Last.fm Scrobbler for YouTube Music
        </p>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        <Link href="/pricing" className="text-sm font-medium hover:underline">
          Pricing
        </Link>
        <Link href="/terms" className="text-sm font-medium hover:underline">
          Terms
        </Link>
        <LastfmLogout />
        <LogoutBtn />
      </nav>
    </header>
  );
};

export default Header;
