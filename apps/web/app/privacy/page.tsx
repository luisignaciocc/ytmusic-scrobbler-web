import React from "react";

import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../../lib/support-contact";

const PrivacyPolicy = () => (
  <main className="container py-10 md:py-16">
    <div className="mx-auto w-full max-w-3xl rounded-2xl border bg-card p-6 leading-relaxed sm:p-10">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Privacy Policy</h1>

      <h2 className="text-xl font-semibold mb-3 mt-8">1. Introduction</h2>
      <p className="mb-6">
        We value your privacy and are committed to protecting your personal
        information. This Privacy Policy explains how we collect, use, and share
        information about you when you use our application (&quot;the
        Application&quot;).
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">2. Information We Collect</h2>
      <p className="mb-4">
        We collect the following types of information:
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
        <li>
          <strong>Account Preferences:</strong> Information about your
          subscription plan and notification preferences.
        </li>
        <li>
          <strong>Contact Information:</strong> Email address used to send you
          service notifications and updates.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mb-3 mt-8">
        3. How We Use Your Information
      </h2>
      <p className="mb-6">We use the information we collect to:</p>
      <ul className="list-disc list-inside mb-6">
        <li>Provide, operate, and maintain the Application.</li>
        <li>Improve, personalize, and expand the Application.</li>
        <li>Understand and analyze how you use the Application.</li>
        <li>Develop new products, services, features, and functionality.</li>
        <li>
          Communicate with you, either directly or through one of our partners,
          for customer service, to provide you with updates and other
          information relating to the Application, and for marketing and
          promotional purposes.
        </li>
        <li>Process your transactions and manage your orders.</li>
        <li>
          Send service notifications when your YouTube Music headers need
          updating.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mb-3 mt-8">
        4. Sharing Your Information
      </h2>
      <p className="mb-6">
        We do not share your personal information with third parties except in
        the following circumstances:
      </p>
      <ul className="list-disc list-inside mb-6">
        <li>With your consent.</li>
        <li>
          For legal reasons, such as to comply with a subpoena or similar legal
          process.
        </li>
        <li>To protect our rights, property, or safety, or those of others.</li>
        <li>
          With service providers who need access to such information to carry
          out work on our behalf.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mb-3 mt-8">5. Data Security</h2>
      <p className="mb-6">
        We implement appropriate technical and organizational measures to
        protect the security of your personal information. However, please note
        that no method of transmission over the Internet or method of electronic
        storage is completely secure.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">6. Limited Use</h2>
      <p className="mb-6">
        Last.fm Scrobbler for YouTube Music&apos;s use and transfer to any other
        app of information received from Google APIs will adhere to{" "}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noreferrer"
          className="underline font-medium text-primary underline underline-offset-2"
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">
        7. Your Data Protection Rights
      </h2>
      <p className="mb-6">
        Depending on your location, you may have the following rights regarding
        your personal information:
      </p>
      <ul className="list-disc list-inside mb-6">
        <li>
          The right to access – You have the right to request copies of your
          personal data.
        </li>
        <li>
          The right to rectification – You have the right to request that we
          correct any information you believe is inaccurate or complete
          information you believe is incomplete.
        </li>
        <li>
          The right to erasure – You have the right to request that we erase
          your personal data, under certain conditions. You can make this
          request by emailing{" "}
          <a href={SUPPORT_MAILTO} className="underline font-medium text-primary underline underline-offset-2">
            {SUPPORT_EMAIL}
          </a>
          ; we will send a confirmation link to the email address of your
          account and delete your data once you confirm.
        </li>
        <li>
          The right to restrict processing – You have the right to request that
          we restrict the processing of your personal data, under certain
          conditions.
        </li>
        <li>
          The right to object to processing – You have the right to object to
          our processing of your personal data, under certain conditions.
        </li>
        <li>
          The right to data portability – You have the right to request that we
          transfer the data that we have collected to another organization, or
          directly to you, under certain conditions.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mb-3 mt-8">
        8. International Data Transfers
      </h2>
      <p className="mb-6">
        Your information, including personal data, may be transferred to and
        maintained on computers located outside of your state, province,
        country, or other governmental jurisdiction where the data protection
        laws may differ from those of your jurisdiction. If you are located
        outside the country in which the Application owner resides and choose to
        provide information to us, please note that we transfer the data,
        including personal data, to that country and process it there. Your
        consent to this Privacy Policy followed by your submission of such
        information represents your agreement to that transfer.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">9. Retention of Data</h2>
      <p className="mb-6">
        We will retain your personal data only for as long as is necessary for
        the purposes set out in this Privacy Policy. We will retain and use your
        personal data to the extent necessary to comply with our legal
        obligations (for example, if we are required to retain your data to
        comply with applicable laws), resolve disputes, and enforce our legal
        agreements and policies.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">
        10. Children&apos;s Privacy
      </h2>
      <p className="mb-6">
        Our Application does not address anyone under the age of 13. We do not
        knowingly collect personally identifiable information from anyone under
        the age of 13. If you are a parent or guardian and you are aware that
        your child has provided us with personal information, please contact us.
        If we become aware that we have collected personal information from
        children without verification of parental consent, we take steps to
        remove that information from our servers.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">
        11. Changes to This Privacy Policy
      </h2>
      <p className="mb-6">
        We may update our Privacy Policy from time to time. We will notify you
        of any changes by posting the new Privacy Policy on this page. You are
        advised to review this Privacy Policy periodically for any changes.
        Changes to this Privacy Policy are effective when they are posted on
        this page.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">12. Contact Us</h2>
      <p className="mb-6">
        If you have any questions about this Privacy Policy, please contact us
        at{" "}
        <a href="mailto:hi@bocono-labs.com" className="underline font-medium text-primary underline underline-offset-2">
          hi@bocono-labs.com
        </a>
        . For help with the service, or to request deletion of your data, email{" "}
        <a href={SUPPORT_MAILTO} className="underline font-medium text-primary underline underline-offset-2">
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </div>
  </main>
);

export default PrivacyPolicy;
