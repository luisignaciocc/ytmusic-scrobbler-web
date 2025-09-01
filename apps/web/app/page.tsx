import { PrismaClient } from "@prisma/client";
import Image from "next/image";
import { getServerSession } from "next-auth";

import LastfmBtn from "./components/lastfm-btn";
import LoginBtn from "./components/login-btn";
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

  if (!user.ytmusicCookie) {
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
    <main className="flex-1">
      <section className="w-full py-4 md:py-8 lg:py-16 xl:py-24">
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

              <div className="space-y-4 mt-6">
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
                    <h3 className="font-semibold mb-1">Sign in with Google</h3>
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
                      Follow our step-by-step guide with images to connect your
                      YouTube Music account
                    </p>
                    {step === 2 && (
                      <div className="mt-2">
                        <YouTubeHeadersForm />
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            💡 Follow the step-by-step guide above to connect
                            your YouTube Music account.
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
                      Authorize the connection with your Last.fm account with a
                      single click
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

      <section className="w-full py-8 md:py-16 lg:py-24 bg-gray-100 dark:bg-gray-800">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                How It Works
              </h2>
              <div className="space-y-4">
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our service works by securely connecting your YouTube Music
                  and Last.fm accounts. Once connected, we automatically track
                  your listening history and sync it with Last.fm. Here&apos;s
                  what happens behind the scenes:
                </p>
                <ul className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400 space-y-2">
                  <li>
                    • We check your YouTube Music listening history for new
                    songs at regular intervals - every hour with our free plan,
                    or every 5 minutes with our Pro plan
                  </li>
                  <li>
                    • We maintain a secure database of your recently played
                    tracks to avoid duplicate scrobbles
                  </li>
                  <li>
                    • New songs are automatically scrobbled to Last.fm with
                    accurate timestamps
                  </li>
                  <li>
                    • We handle connection issues gracefully and ensure no songs
                    are lost
                  </li>
                  <li>
                    • We use your browser cookie to securely access your YouTube
                    Music history - this cookie may occasionally expire, but
                    we&apos;ll send you up to 3 email reminders (immediately,
                    after 2 days, and after 5 days) when you need to refresh it.
                    After the third notification, your account will be
                    automatically paused until you update your credentials
                  </li>
                  <li>
                    • After initial setup, it may take up to an hour for your
                    first songs to appear on Last.fm. After that, the scrobbling
                    frequency will depend on your selected plan (1 hour for free
                    users, 5 minutes for Pro users)
                  </li>
                </ul>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Just like your phone needs to stay logged in to your apps, our
                  service needs to maintain a secure connection to your YouTube
                  Music account. Sometimes this connection might expire, and
                  when that happens, you&apos;ll need to reconnect using the
                  same simple steps as before.
                </p>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Need help? We&apos;re here for you! Contact us at{" "}
                  <a
                    href="mailto:me@luisignacio.cc"
                    className="underline text-blue-500"
                  >
                    me@luisignacio.cc
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-8 md:py-16 lg:py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Privacy & Security</h2>
              <p className="text-gray-500">
                Your privacy is our priority. All your account information is
                encrypted and stored securely. We never share your data with
                third parties.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Simple & Reliable</h2>
              <p className="text-gray-500">
                Our service is designed to be simple and reliable. Once set up,
                it works automatically in the background, keeping your Last.fm
                profile up to date.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-8 md:py-16 lg:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Everything you need to know about how our service works
              </p>
            </div>
            <div className="max-w-[800px] space-y-6 text-left">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  How does the scrobbling process work?
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Our service connects to your YouTube Music account using
                  browser cookies and checks for new songs at regular intervals.
                  Free users get updates every hour, while Pro users get updates
                  every 5 minutes. When we find new songs that were played
                  &quot;today&quot; in your history, we automatically scrobble
                  them to Last.fm. Since YouTube Music doesn&apos;t provide
                  exact play times, we generate timestamps spaced 30 seconds
                  apart (most recent first) to maintain proper chronological
                  order.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  What do I need to get started?
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You need: (1) A Google account to sign in, (2) An active
                  YouTube Music subscription or free account, (3) A Last.fm
                  account, and (4) Access to a web browser to copy your YouTube
                  Music cookie. No technical skills required - we provide
                  step-by-step instructions with screenshots.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  Why do I need to provide my YouTube Music cookie?
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  YouTube Music doesn&apos;t have a public API, so we use your
                  browser cookie to access your listening history - the same way
                  your browser does when you&apos;re logged in. This cookie acts
                  like a temporary key that proves you&apos;re authorized to
                  access your own data. It&apos;s completely safe and we never
                  store your password.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  What happens if my YouTube Music cookie expires?
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Cookies naturally expire over time (usually every few weeks or
                  months). When this happens, we&apos;ll automatically detect
                  the issue and send you up to 3 email notifications:
                  immediately, after 2 days, and after 5 days. After the third
                  notification, your account will be automatically paused until
                  you update your cookie. This prevents unnecessary processing
                  and ensures you&apos;re aware of the issue.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  Does this work with the YouTube Music mobile app?
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Yes! If you set up the cookie from your browser, we can
                  scrobble songs from any YouTube Music app (mobile, desktop,
                  web) as long as you&apos;re using the same Google account. The
                  cookie allows us to access your complete listening history
                  across all devices and apps where you&apos;re signed in.
                  However, songs played in private/incognito browser sessions
                  won&apos;t appear in your history and therefore won&apos;t be
                  scrobbled.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  Can I use this with Google Pages or business accounts?
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Yes, but you&apos;ll need to set a custom notification email
                  in your preferences. Google Pages accounts (like
                  business@pages.google.com) can&apos;t receive our automated
                  emails, so we require a valid personal email address to send
                  you important updates about your scrobbling status.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  How accurate is the scrobbling?
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Very accurate for song information and order! We extract the
                  exact song titles, artists, and albums from YouTube Music.
                  Since YouTube Music only tells us which songs were played
                  &quot;today&quot; (not exact times), we generate timestamps
                  automatically - spacing them 30 seconds apart with the most
                  recently played songs getting newer timestamps. We also
                  prevent duplicate scrobbles by maintaining a database of your
                  recently played songs. This ensures proper chronological order
                  on your Last.fm profile.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Is my data safe?</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Absolutely. We only store the minimum data needed: your email,
                  Last.fm username, and YouTube Music cookie. We never store
                  your passwords, and your cookie is encrypted in our database.
                  We use this data solely to provide the scrobbling service and
                  never share it with third parties. You can delete your account
                  and all associated data at any time.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  What&apos;s the difference between Free and Pro plans?
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Free users get their music scrobbled every hour, while Pro
                  users get updates every 5 minutes. Pro users also get higher
                  priority in our processing queue, meaning more consistent and
                  faster scrobbling. Both plans include the same notification
                  system and reliability features.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
