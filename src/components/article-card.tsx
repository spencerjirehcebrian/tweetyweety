"use client";

import { ArticleData } from "@/lib/types";
import { CalendarIcon, LinkIcon } from "./icons";

interface ArticleCardProps {
  data: ArticleData;
}

export function ArticleCard({ data }: ArticleCardProps) {
  let formattedDate: string | null = null;
  if (data.publishedDate) {
    try {
      const date = new Date(data.publishedDate);
      formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      formattedDate = data.publishedDate;
    }
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      {data.featuredImage && (
        <div className="h-48 w-full overflow-hidden bg-surface-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.featuredImage}
            alt={data.title ?? "Featured image"}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="p-4 space-y-3">
        {data.title && (
          <h2 className="text-lg font-bold text-text-primary">
            {data.title}
          </h2>
        )}

        <div className="flex flex-wrap gap-2">
          {data.author && (
            <span className="rounded-full bg-surface-secondary border border-border-default px-2.5 py-0.5 text-xs text-text-secondary">
              {data.author}
            </span>
          )}
          {data.siteName && (
            <span className="flex items-center gap-1 rounded-full bg-surface-secondary border border-border-default px-2.5 py-0.5 text-xs text-text-secondary">
              <LinkIcon width={10} height={10} />
              {data.siteName}
            </span>
          )}
          {formattedDate && (
            <span className="flex items-center gap-1 rounded-full bg-surface-secondary border border-border-default px-2.5 py-0.5 text-xs text-text-secondary">
              <CalendarIcon width={10} height={10} />
              {formattedDate}
            </span>
          )}
        </div>

        {data.excerpt && (
          <p className="italic text-text-secondary text-sm">
            {data.excerpt}
          </p>
        )}

        <div className="whitespace-pre-wrap leading-relaxed text-text-primary max-h-[60vh] overflow-y-auto">
          {data.text}
        </div>
      </div>
    </div>
  );
}
