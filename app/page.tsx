"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [authorizationUrl, setAuthorizationUrl] = useState("");

  useEffect(() => {
    const initiateOAuth = async () => {
      const response = await fetch("/api/auth/initiate");
      const data = await response.json();
      setAuthorizationUrl(data.authorizationUrl);
    };

    initiateOAuth();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <h1>Authorize Your Application</h1>
        <p>
          <a href={authorizationUrl} target="_blank" rel="noopener noreferrer">
            Click here to authorize
          </a>
        </p>
      </div>
    </main>
  );
}
