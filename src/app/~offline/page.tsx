import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold tracking-tight">You&apos;re offline</h1>
      <p className="text-sm text-foreground/55 max-w-sm">
        Tourister needs a connection for maps and trip data. Reconnect and try
        again.
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Try again →
      </Link>
    </main>
  );
}
