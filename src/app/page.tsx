import { UrlForm } from "@/components/url-form";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            TweetyWeety
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Convert Twitter/X posts and articles into clean readable text.
          </p>
        </div>
        <UrlForm />
      </div>
    </div>
  );
}
