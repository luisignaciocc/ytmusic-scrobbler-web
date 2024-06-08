import LoginButton from "./components/login-btn";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <h1>Authorize Your Application</h1>
        <LoginButton />
      </div>
    </main>
  );
}
