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
                    songs at regular intervals - every 30 minutes with our free
                    plan, or every 5 minutes with our Pro plan
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
                    • Free plan users receive weekly notifications when YouTube
                    Music headers need updating, while Pro users get immediate
                    notifications for uninterrupted service
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
    </main>
  );
}
