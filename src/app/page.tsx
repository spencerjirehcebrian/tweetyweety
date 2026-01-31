import { Header } from "@/components/header";
import { UrlForm } from "@/components/url-form";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-start justify-center px-4 pt-16 sm:pt-20">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="font-display text-[3.5rem] sm:text-[4.5rem] font-normal italic tracking-tight leading-[1.1] text-text-primary">
              TweetyWeety
            </h1>
            <p className="mt-2 text-lg sm:text-xl font-light tracking-wide text-text-secondary">
              Convert any link to text
            </p>
            <p className="mt-2 text-sm font-light tracking-wide text-text-tertiary">
              Paste any URL to extract clean, readable text.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-x-12 -inset-y-8 rounded-3xl bg-surface-glow blur-2xl pointer-events-none animate-shimmer-glow" />
            <div className="relative">
              <UrlForm />
            </div>
          </div>
        </div>
      </main>
      <footer className="relative py-6 text-center text-[0.8125rem] text-text-tertiary">
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />
        TweetyWeety
      </footer>
    </div>
  );
}
