import Image from "next/image";
import Link from "next/link";

import Music2Icon from "./components/music-icon";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="#">
          <Music2Icon className="h-6 w-6" />
          <span className="sr-only">Scrobbler</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            Pricing
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            About
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            Contact
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Scrobble Your Music to Last.fm
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Automatically track your music listening habits and share
                    your taste with the world. Our service seamlessly integrates
                    with your favorite music apps to scrobble your plays to
                    Last.fm.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                    href="#"
                  >
                    Sign Up
                  </Link>
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
                    href="#"
                  >
                    Try It Free
                  </Link>
                </div>
              </div>
              <Image
                alt="Hero"
                className="mx-auto aspect-square overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                height="550"
                src="/logo.png"
                width="550"
              />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  How It Works
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Effortless Music Tracking
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our service seamlessly integrates with your favorite music
                  apps to automatically scrobble your listening history to
                  Last.fm. No more manual tracking or complicated setup.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <Image
                alt="How It Works"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                height="310"
                src="/screenshot.png"
                width="550"
              />
              <div className="flex flex-col justify-center space-y-4">
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">Connect Your Apps</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Link your Spotify, Apple Music, or other music streaming
                        accounts to our service.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">
                        Automatic Scrobbling
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        As you listen to music, your plays are automatically
                        logged and sent to Last.fm.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">Analyze Your Taste</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Dive into your listening history and discover new music
                        based on your preferences.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  Testimonials
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  What Our Users Say
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Hear from real people who have used our service to enhance
                  their music listening experience.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-gray-300 dark:bg-gray-700 w-12 h-12 flex items-center justify-center text-2xl">
                    🎵
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Jane Doe</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Music Enthusiast
                    </p>
                  </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  &quot;Scrobbler has been a game-changer for me. It&apos;s so
                  easy to\n use and has helped me discover so much new music
                  based on my\n listening habits. Highly recommend!&quot;
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-gray-300 dark:bg-gray-700 w-12 h-12 flex items-center justify-center text-2xl">
                    🎧
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">John Smith</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Music Lover
                    </p>
                  </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  &quot;I&apos;ve been using Scrobbler for years and it&apos;s
                  the best way to\n keep track of my music listening habits. The
                  integration with\n Last.fm is seamless and I love being able
                  to see my stats and\n discover new artists.&quot;
                </p>
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                href="#"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 Scrobbler. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
