import { Header } from "@/components/header";
import { UrlForm } from "@/components/url-form";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-start justify-center px-4 pt-16 sm:pt-20">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-[2.625rem] font-bold tracking-tight text-text-primary">
              Convert any link
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Paste a Twitter/X post or article URL to extract clean, readable
              text.
            </p>
          </div>
          <UrlForm />
        </div>
      </main>
      <footer className="py-4 text-center text-[0.8125rem] text-text-tertiary">
        TweetyWeety
      </footer>
    </div>
  );
}
