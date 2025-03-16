import { PrismaClient } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";

import LastfmBtn from "./components/lastfm-btn";
import LastfmLogout from "./components/lastfm-logout";
import LoginBtn from "./components/login-btn";
import LogoutBtn from "./components/logout-btn";
import Music2Icon from "./components/music-icon";
import ScrobbleBtnServer from "./components/scrobble-button-server";
import YouTubeHeadersForm from "./components/youtube-headers-form";

const prisma = new PrismaClient();

async function getUserStatus() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return { step: 1 };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return { step: 1 };
  }

  if (!user.ytmusicCookie || !user.ytmusicAuthUser) {
    return { step: 2 };
  }

  if (!user.lastFmSessionKey) {
    return { step: 3 };
  }

  return { step: 4, isActive: user.isActive };
}

export default async function Home() {
  const { step, isActive } = await getUserStatus();

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-14 flex items-center top-0 sticky bg-[hsl(var(--background))] border-b">
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
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Connect YouTube Music with Last.fm
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Automatically track all the music you listen to on YouTube
                    Music in your Last.fm profile. It&apos;s easy, secure, and
                    fully automatic once set up.
                  </p>
                </div>

                <div className="space-y-6 mt-8">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step === 1
                          ? "bg-blue-600 text-white"
                          : step > 1
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step > 1 ? "✓" : "1"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">
                        Sign in with Google
                      </h3>
                      <p className="text-sm text-gray-500">
                        Create your account to get started - it&apos;s free and
                        secure
                      </p>
                      {step === 1 && (
                        <div className="mt-2">
                          <LoginBtn />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step === 2
                          ? "bg-blue-600 text-white"
                          : step > 2
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step > 2 ? "✓" : "2"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">
                        Connect YouTube Music
                      </h3>
                      <p className="text-sm text-gray-500">
                        Follow our step-by-step guide with images to connect
                        your YouTube Music account
                      </p>
                      {step === 2 && (
                        <div className="mt-2">
                          <YouTubeHeadersForm />
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              💡 Need help? Watch our video tutorial that shows
                              you exactly what to do. Don&apos;t worry,
                              we&apos;ll guide you through each step.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step === 3
                          ? "bg-blue-600 text-white"
                          : step > 3
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step > 3 ? "✓" : "3"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Connect Last.fm</h3>
                      <p className="text-sm text-gray-500">
                        Authorize the connection with your Last.fm account with
                        a single click
                      </p>
                      {step === 3 && (
                        <div className="mt-2">
                          <LastfmBtn />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step === 4
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Ready!</h3>
                      <p className="text-sm text-gray-500">
                        Activate the service and start tracking your music
                        automatically
                      </p>
                      {step === 4 && (
                        <div className="mt-2">
                          <ScrobbleBtnServer />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Image
                  alt="Hero"
                  className="mx-auto aspect-square overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                  height="550"
                  src="/logo.png"
                  width="550"
                />
                {step === 4 && isActive && (
                  <div className="absolute -top-4 -right-4 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                    Active & Scrobbling
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Important Information
                </h2>
                <div className="space-y-4">
                  <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    To keep your connection active, you&apos;ll need to update
                    your YouTube Music account information approximately once a
                    month. We&apos;ll send you an email reminder when it&apos;s
                    needed.
                  </p>
                  <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    The service checks your play history every 5 minutes, so
                    there might be a small delay between when you listen to a
                    song and when it appears on your Last.fm profile.
                  </p>
                  <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    Have questions or need help? Email us at{" "}
                    <a
                      href="mailto:me@luisignacio.cc"
                      className="underline text-blue-500"
                    >
                      me@luisignacio.cc
                    </a>{" "}
                    and we&apos;ll be happy to help.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold">Privacy & Security</h2>
                <p className="text-gray-500">
                  Your privacy is our priority. All your account information is
                  protected and encrypted. We only use the necessary data to
                  connect with YouTube Music and Last.fm. You can delete your
                  account and all your information at any time.
                </p>
                <div className="flex gap-4">
                  <Link
                    href="/privacy"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold">Support Us</h2>
                <p className="text-gray-500">
                  If you enjoy using our service and would like to support its
                  development, consider buying us a coffee. Your support helps
                  keep the service running and free for everyone.
                </p>
                <a
                  href="https://www.buymeacoffee.com/luisignaciocc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                >
                  Buy us a coffee
                </a>
              </div>
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
