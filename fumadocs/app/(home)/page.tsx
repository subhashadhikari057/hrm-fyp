import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 px-6 text-center transition-colors dark:from-neutral-950 dark:to-neutral-900">
      {/* Title */}
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        Welcome 
      </h1>

      {/* Intro */}
      <p className="mb-6 max-w-xl text-lg text-gray-600 dark:text-gray-400">
        This project documentation helps you understand the system architecture,
        features, and development approach in a clear and structured way.
      </p>

      {/* Call to action */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/docs"
          className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          View KaryaSetu Documentation
        </Link>

        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Learn More
        </Link>
      </div>

      {/* Footer note */}
      <p className="mt-10 text-sm text-gray-400 dark:text-gray-500">
        Built with modern web technologies and best practices.
      </p>
    </main>
  );
}
