import Link from "next/link";
import React from "react";

const TermsOfService = () => (
  <main className="container py-10 md:py-16">
    <div className="mx-auto w-full max-w-3xl rounded-2xl border bg-card p-6 leading-relaxed sm:p-10">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Terms of Service</h1>

      <h2 className="text-xl font-semibold mb-3 mt-8">
        1. Acceptance of the Terms
      </h2>
      <p className="mb-6">
        By using our application (&quot;the Application&quot;), which takes your
        YouTube Music listening history and scrobbles it to Last.fm, you agree
        to be bound by these Terms of Service (&quot;the Terms&quot;). If you do
        not agree with these Terms, you should not use the Application.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">
        2. Description of the Service
      </h2>
      <p className="mb-6">
        The Application, operated by Bocono Labs, offers a service that collects
        your YouTube Music listening history and sends it to your Last.fm
        account. This service is designed to enhance your musical experience and
        allow better tracking of your listening habits.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">3. Data Usage</h2>
      <p className="mb-4">
        The Application collects and uses the following data:
      </p>
      <ul className="list-disc list-inside mb-6">
        <li>
          <strong>YouTube Music History:</strong> Information about the music
          you have listened to on YouTube Music.
        </li>
        <li>
          <strong>Last.fm Information:</strong> Data needed to authenticate your
          Last.fm account and perform scrobbling.
        </li>
      </ul>
      <p className="mb-6">
        All collected information will be used exclusively to provide the
        service and will not be shared with third parties without your explicit
        consent.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">4. Privacy</h2>
      <p className="mb-6">
        We are committed to protecting your privacy. For more information on how
        we collect, use, and protect your personal information, please review
        our{" "}
        <Link href="/privacy" className="underline font-medium text-primary underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">5. User Responsibilities</h2>
      <p className="mb-4">You are responsible for:</p>
      <ul className="list-disc list-inside mb-6">
        <li>Maintaining the confidentiality of your Last.fm credentials.</li>
        <li>
          Ensuring that the use of the Application complies with YouTube and
          Last.fm policies.
        </li>
        <li>Not using the Application in a fraudulent or illegal manner.</li>
      </ul>

      <h2 className="text-xl font-semibold mb-3 mt-8">
        6. Limitation of Liability
      </h2>
      <p className="mb-6">
        The Application is provided &quot;as is&quot; and &quot;as
        available&quot;. We do not warrant that the service will be
        uninterrupted or error-free. We will not be liable for any indirect,
        incidental, special, consequential, or punitive damages arising out of
        the use or inability to use the Application.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">7. Changes to the Terms</h2>
      <p className="mb-6">
        We reserve the right to modify these Terms at any time. We will notify
        you of any significant changes through a notice in the Application or by
        email. Continued use of the Application after such changes constitutes
        your acceptance of the new Terms.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">8. Termination of Service</h2>
      <p className="mb-6">
        We may suspend or terminate your access to the Application at any time
        and for any reason, including, but not limited to, violation of these
        Terms.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">
        9. Subscription Plans and Refund Policy
      </h2>
      <p className="mb-6">
        The Application offers different subscription plans (Free and Pro) with
        varying update intervals and features. The Free plan checks for new
        music every 30 minutes and the Pro plan checks every 5 minutes. All
        users receive immediate notifications when YouTube Music headers need
        refreshing. Details about these plans can be found on our{" "}
        <Link href="/pricing" className="underline font-medium text-primary underline underline-offset-2">
          Pricing page
        </Link>
        .
      </p>
      <p className="mb-6">
        Bocono Labs offers a 30-day money-back guarantee for all paid
        subscriptions. If you are not satisfied with our service, you may
        request a refund within 30 days of your purchase. To request a refund,
        please contact us at{" "}
        <a href="mailto:hi@bocono-labs.com" className="underline font-medium text-primary underline underline-offset-2">
          hi@bocono-labs.com
        </a>
        . Refunds will be processed within 5-10 business days of approval. Once
        approved, the refund will be credited back to your original payment
        method.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">10. Governing Law</h2>
      <p className="mb-6">
        These Terms will be governed and construed in accordance with the laws
        of the country in which Bocono Labs operates, without regard to its
        conflict of law principles.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">11. Contact</h2>
      <p className="mb-6">
        If you have any questions about these Terms, please contact us at{" "}
        <a href="mailto:hi@bocono-labs.com" className="underline font-medium text-primary underline underline-offset-2">
          hi@bocono-labs.com
        </a>
        .
      </p>
    </div>
  </main>
);

export default TermsOfService;
