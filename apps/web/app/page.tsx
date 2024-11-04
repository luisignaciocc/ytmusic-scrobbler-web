import { AlertTriangleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import LastfmBtn from "./components/lastfm-btn";
import LastfmLogout from "./components/lastfm-logout";
import LoginBtn from "./components/login-btn";
import LogoutBtn from "./components/logout-btn";
import Music2Icon from "./components/music-icon";
import ScrobbleBtnServer from "./components/scrobble-button-server";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Alert variant="destructive">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertTitle>Service Unavailable</AlertTitle>
        <AlertDescription>
          Unfortunately, due to recent changes in YouTube&apos;s integration
          API, our service is currently unavailable. Since the problem is on
          YouTube&apos;s side, we are unable to provide an estimated time for
          when the service will be back up. Nevertheless, the original project
          is still available on{" "}
          <a
            href="https://github.com/luisignaciocc/youtube-music-scrobbler"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500"
          >
            GitHub
          </a>{" "}
          and you can run it on your own server, you&apos;ll need a little
          coding knowledge to set it up. We apologize for the inconvenience and
          thank you for using our service.
        </AlertDescription>
      </Alert>
      <header className="px-4 lg:px-6 h-14 flex items-center top-0 sticky bg-[hsl(var(--background))]">
        <Link className="flex items-center justify-center space-x-3" href="/">
          <Music2Icon className="h-6 w-6" />
          <p className="font-semibold hidden sm:block">
            Last.fm Scrobbler for YouTube Music
          </p>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <LastfmLogout />
          <LogoutBtn />
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Scrobble Your Plays from YouTube Music
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Automatically track your music listening habits and share
                    your taste with the world. Our service seamlessly integrates
                    with Youtube Music to scrobble your plays to Last.fm.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <LoginBtn />
                  <LastfmBtn />
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
                  Our service seamlessly integrates with Youtube Music to
                  automatically scrobble your listening history to Last.fm on
                  our server . No more manual tracking or complicated setup, and
                  no need to install any apps on your device or browser.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <a
                target="_blank"
                href="https://www.last.fm/user/luisignaciocc"
                rel="noopener noreferrer"
                className="mx-auto lg:order-last"
              >
                <Image
                  alt="How It Works"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center"
                  height="310"
                  src="/screenshot.png"
                  width="550"
                />
              </a>
              <div className="flex flex-col justify-center space-y-4">
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">
                        Connect your YouTube Account
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Link YourTube with your Google account, click on the
                        Sign in button and authorize the app.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">
                        Authorize Last.fm Scrobbling
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Click on the Authorize on Last.fm button and sign in to
                        your Last.fm account.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">
                        Start Scrobbling Your Plays
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Click on the Start Scrobbling button to tell our server
                        to start tracking your listening history. You can pause
                        or resume our background scrobbling at any time.
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
                  Limitations
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Important
                </h2>
                <div className="space-y-4">
                  <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    Since YouTube Music does not provide an official API, our
                    service relies on scraping techniques to get the necessary
                    data. This has been working well for our use case, but it
                    has some limitations like not being able to get the exact
                    time of when a song was played.
                  </p>
                  <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    To mitigate this, we use the time when the song was
                    scrobbled, which is the time when our server received the
                    data. Currently our process is set to run every 5 minutes,
                    so the time when a song is scrobbled can be up to 5 minutes
                    after it was played.
                  </p>
                  <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    It&apos;s important that you check the YouTube permissions
                    to make sure that the app has access to your YouTube Music
                    history. If you have any concerns about privacy or security,
                    please reach out to us.
                  </p>
                  <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    With the button below you can start and stop the process of
                    scrobbling your plays from YouTube Music. If you have any
                    questions or feedback, feel free to reach out to us at{" "}
                    <a
                      href="mailto:me@luisignacio.cc"
                      className="underline text-blue-500"
                    >
                      me@luisignacio.cc
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <ScrobbleBtnServer />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 flex justify-center bg-gray-100">
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
              <a
                href="https://www.last.fm/user/end_me_plz"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-gray-300 dark:bg-gray-700 w-12 h-12 flex items-center justify-center text-2xl">
                      🎵
                    </div>
                    <div>
                      <h3 className="text-xl font-bold dark:text-gray-300">
                        Emilio Cabezas
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Music Enthusiast
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    &quot;Scrobbler has been a game-changer for me. It&apos;s so
                    easy to use and has helped me discover so much new music
                    based on my listening habits. Highly recommend!&quot;
                  </p>
                </div>
              </a>
              <a
                href="https://www.last.fm/user/luisignaciocc"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-gray-300 dark:bg-gray-700 w-12 h-12 flex items-center justify-center text-2xl">
                      🎧
                    </div>
                    <div>
                      <h3 className="text-xl font-bold dark:text-gray-300">
                        Ignacio Collantes
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Music Lover
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    &quot;I&apos;ve been using Scrobbler for years and it&apos;s
                    the best way to keep track of my music listening habits. The
                    integration with Last.fm is seamless and I love being able
                    to see my stats and discover new artists.&quot;
                  </p>
                </div>
              </a>
            </div>
            <div className="mt-8 text-center">
              <p>
                If you enjoy using our service and would like to support us,
                consider{" "}
                <a
                  href="https://www.buymeacoffee.com/luisignaciocc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-500"
                >
                  buying us a coffee
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Boconó Labs. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-xs hover:underline underline-offset-4"
            href="/terms"
          >
            Terms of Service
          </Link>
          <Link
            className="text-xs hover:underline underline-offset-4"
            href="/privacy"
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
