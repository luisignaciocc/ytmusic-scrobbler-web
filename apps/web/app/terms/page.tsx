import React from "react";

const TermsOfService = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-100">
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl">
      <h1 className="text-4xl font-bold mb-6 text-center">Terms of Service</h1>

      <h2 className="text-2xl font-semibold mb-4">
        1. Acceptance of the Terms
      </h2>
      <p className="mb-6 text-justify">
        By using our application (&quot;the Application&quot;), which takes your
        YouTube history and scrobbles it to Last.fm, you agree to be bound by
        these Terms of Service (&quot;the Terms&quot;). If you do not agree with
        these Terms, you should not use the Application.
      </p>

      <h2 className="text-2xl font-semibold mb-4">
        2. Description of the Service
      </h2>
      <p className="mb-6 text-justify">
        The Application offers a service that collects your YouTube viewing
        history and sends it to your Last.fm account. This service is designed
        to enhance your musical experience and allow better tracking of your
        listening habits.
      </p>

      <h2 className="text-2xl font-semibold mb-4">3. Data Usage</h2>
      <p className="mb-4 text-justify">
        The Application collects and uses the following data:
      </p>
      <ul className="list-disc list-inside mb-6">
        <li>
          <strong>YouTube History:</strong> Information about the videos you
          have watched on YouTube.
        </li>
        <li>
          <strong>Last.fm Information:</strong> Data needed to authenticate your
          Last.fm account and perform scrobbling.
        </li>
      </ul>
      <p className="mb-6 text-justify">
        All collected information will be used exclusively to provide the
        service and will not be shared with third parties without your explicit
        consent.
      </p>

      <h2 className="text-2xl font-semibold mb-4">4. Privacy</h2>
      <p className="mb-6 text-justify">
        We are committed to protecting your privacy. For more information on how
        we collect, use, and protect your personal information, please review
        our Privacy Policy.
      </p>

      <h2 className="text-2xl font-semibold mb-4">5. User Responsibilities</h2>
      <p className="mb-4 text-justify">You are responsible for:</p>
      <ul className="list-disc list-inside mb-6">
        <li>Maintaining the confidentiality of your Last.fm credentials.</li>
        <li>
          Ensuring that the use of the Application complies with YouTube and
          Last.fm policies.
        </li>
        <li>Not using the Application in a fraudulent or illegal manner.</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">
        6. Limitation of Liability
      </h2>
      <p className="mb-6 text-justify">
        The Application is provided &quot;as is&quot; and &quot;as
        available&quot;. We do not warrant that the service will be
        uninterrupted or error-free. We will not be liable for any indirect,
        incidental, special, consequential, or punitive damages arising out of
        the use or inability to use the Application.
      </p>

      <h2 className="text-2xl font-semibold mb-4">7. Changes to the Terms</h2>
      <p className="mb-6 text-justify">
        We reserve the right to modify these Terms at any time. We will notify
        you of any significant changes through a notice in the Application or by
        email. Continued use of the Application after such changes constitutes
        your acceptance of the new Terms.
      </p>

      <h2 className="text-2xl font-semibold mb-4">8. Termination of Service</h2>
      <p className="mb-6 text-justify">
        We may suspend or terminate your access to the Application at any time
        and for any reason, including, but not limited to, violation of these
        Terms.
      </p>

      <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
      <p className="mb-6 text-justify">
        These Terms will be governed and construed in accordance with the laws
        of the country in which the Application owner resides, without regard to
        its conflict of law principles.
      </p>

      <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
      <p className="mb-6 text-justify">
        If you have any questions about these Terms, please contact us at{" "}
        <a href="mailto:me@luisignacio.cc" className="underline text-blue-500">
          me@luisignacio.cc
        </a>
        .
      </p>
    </div>
  </div>
);

export default TermsOfService;
