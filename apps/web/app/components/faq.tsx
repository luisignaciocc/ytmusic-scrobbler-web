import { ChevronDown } from "lucide-react";

import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../../lib/support-contact";

const supportLink = (subject?: string) => (
  <a
    href={
      subject
        ? `${SUPPORT_MAILTO}?subject=${encodeURIComponent(subject)}`
        : SUPPORT_MAILTO
    }
    className="font-medium text-primary underline underline-offset-2"
  >
    {SUPPORT_EMAIL}
  </a>
);

const QUESTIONS: { question: string; answer: React.ReactNode }[] = [
  {
    question: "How does the scrobbling process work?",
    answer: (
      <>
        Our service connects to your YouTube Music account using browser
        cookies and checks for new songs at regular intervals. Free users get
        updates every hour, while Pro users get updates every 5 minutes. When
        we find new songs that were played &quot;today&quot; in your history,
        we automatically scrobble them to Last.fm. Since YouTube Music
        doesn&apos;t provide exact play times, we generate timestamps spaced 30
        seconds apart (most recent first) to maintain proper chronological
        order.
      </>
    ),
  },
  {
    question: "What do I need to get started?",
    answer: (
      <>
        You need: (1) A Google account to sign in, (2) An active YouTube Music
        subscription or free account, (3) A Last.fm account, and (4) Access to
        a web browser to copy your YouTube Music cookie. No technical skills
        required - we provide step-by-step instructions with screenshots.
      </>
    ),
  },
  {
    question: "Why do I need to provide my YouTube Music cookie?",
    answer: (
      <>
        YouTube Music doesn&apos;t have a public API, so we use your browser
        cookie to access your listening history - the same way your browser
        does when you&apos;re logged in. This cookie acts like a temporary key
        that proves you&apos;re authorized to access your own data. It&apos;s
        completely safe and we never store your password.
      </>
    ),
  },
  {
    question: "What happens if my YouTube Music cookie expires?",
    answer: (
      <>
        Google decides how long a YouTube session lasts, and it can range from
        a few hours to several weeks, so sooner or later the cookie has to be
        refreshed. When we detect the problem, your account is paused and we
        send you up to 3 email notifications: immediately, after 2 days, and
        after 5 days. Scrobbling resumes as soon as you paste a fresh cookie.
      </>
    ),
  },
  {
    question: "Does this work with the YouTube Music mobile app?",
    answer: (
      <>
        Yes! If you set up the cookie from your browser, we can scrobble songs
        from any YouTube Music app (mobile, desktop, web) as long as
        you&apos;re using the same Google account. The cookie allows us to
        access your complete listening history across all devices and apps
        where you&apos;re signed in. However, songs played in private/incognito
        browser sessions won&apos;t appear in your history and therefore
        won&apos;t be scrobbled.
      </>
    ),
  },
  {
    question: "Can I use this with Google Pages or business accounts?",
    answer: (
      <>
        Yes, but you&apos;ll need to set a custom notification email in your
        preferences. Google Pages accounts (like business@pages.google.com)
        can&apos;t receive our automated emails, so we require a valid personal
        email address to send you important updates about your scrobbling
        status.
      </>
    ),
  },
  {
    question: "How accurate is the scrobbling?",
    answer: (
      <>
        Very accurate for song information and order! We extract the exact
        song titles, artists, and albums from YouTube Music. Since YouTube
        Music only tells us which songs were played &quot;today&quot; (not
        exact times), we generate timestamps automatically - spacing them 30
        seconds apart with the most recently played songs getting newer
        timestamps. We also prevent duplicate scrobbles by maintaining a
        database of your recently played songs. This ensures proper
        chronological order on your Last.fm profile.
      </>
    ),
  },
  {
    question: "Is my data safe?",
    answer: (
      <>
        Absolutely. We only store the minimum data needed: your email, Last.fm
        username, and YouTube Music cookie. We never store your passwords, and
        your cookie is encrypted in our database. We use this data solely to
        provide the scrobbling service and never share it with third parties.
        You can delete your account and all associated data at any time.
      </>
    ),
  },
  {
    question: "What's the difference between Free and Pro plans?",
    answer: (
      <>
        Free users get their music scrobbled every hour, while Pro users get
        updates every 5 minutes. Pro users also get higher priority in our
        processing queue, meaning more consistent and faster scrobbling. Both
        plans include the same notification system and reliability features.
      </>
    ),
  },
  {
    question:
      "My cookie keeps expiring every few hours or days. Am I doing something wrong?",
    answer: (
      <>
        Probably not. Google invalidates YouTube sessions on its own schedule
        and we can&apos;t extend that from our side. What often helps: open
        music.youtube.com in a private/incognito window, sign in, play a song,
        copy the request from the Network tab as described in the setup steps,
        paste it here, and then close the private window without signing out.
        A tab left open keeps rotating the session and invalidates the copy we
        hold. If it still fails repeatedly, email {supportLink()}.
      </>
    ),
  },
  {
    question: "How do I delete my account and data?",
    answer: (
      <>
        Email {supportLink("Delete my account and data")} from any address.
        We&apos;ll send a confirmation link to the email of your account; once
        you confirm, your credentials, Last.fm connection and scrobble history
        are permanently deleted. If you have an active paid subscription,
        cancel it first on the pricing page.
      </>
    ),
  },
];

/** Questions collapsed by default; native <details>, so it works without JS. */
export default function Faq() {
  return (
    <div className="divide-y rounded-xl border bg-card">
      {QUESTIONS.map(({ question, answer }) => (
        <details key={question} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium [&::-webkit-details-marker]:hidden">
            <span>{question}</span>
            <ChevronDown
              className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="px-5 pb-5 leading-relaxed text-muted-foreground">
            {answer}
          </p>
        </details>
      ))}
    </div>
  );
}
