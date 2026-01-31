"use client";

import { SingleTweet } from "@/lib/types";
import { TweetCard } from "./tweet-card";

interface ThreadDisplayProps {
  thread: SingleTweet[];
  mainTweet: SingleTweet;
}

export function ThreadDisplay({ thread, mainTweet }: ThreadDisplayProps) {
  const allTweets = [...thread, mainTweet];

  return (
    <div className="relative">
      {/* Vertical thread line */}
      <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-accent-primary/30 via-border-default to-transparent" />

      <div className="space-y-0">
        {allTweets.map((tweet, i) => {
          const isLast = i === allTweets.length - 1;
          return (
            <div key={i} className="relative pl-0">
              <div className={isLast ? "" : "pb-2"}>
                <TweetCard
                  tweet={tweet}
                  variant={isLast ? "primary" : "thread-item"}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
