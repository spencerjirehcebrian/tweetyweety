export function TweetSkeleton() {
  return (
    <div className="card mt-6 rounded-xl overflow-hidden p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-surface-elevated animate-skeleton" />
        <div className="space-y-2">
          <div className="h-3 w-28 rounded-sm bg-surface-elevated animate-skeleton" />
          <div className="h-2.5 w-20 rounded-sm bg-surface-elevated animate-skeleton" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded-sm bg-surface-elevated animate-skeleton" />
        <div className="h-3 w-4/5 rounded-sm bg-surface-elevated animate-skeleton" />
        <div className="h-3 w-3/5 rounded-sm bg-surface-elevated animate-skeleton" />
      </div>
      <div className="flex gap-6 pt-1">
        <div className="h-3 w-12 rounded-sm bg-surface-elevated animate-skeleton" />
        <div className="h-3 w-12 rounded-sm bg-surface-elevated animate-skeleton" />
        <div className="h-3 w-12 rounded-sm bg-surface-elevated animate-skeleton" />
      </div>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="card mt-6 rounded-xl overflow-hidden p-5 space-y-4">
      <div className="h-5 w-3/4 rounded-sm bg-surface-elevated animate-skeleton" />
      <div className="flex gap-2">
        <div className="h-5 w-20 rounded-full bg-surface-elevated animate-skeleton" />
        <div className="h-5 w-24 rounded-full bg-surface-elevated animate-skeleton" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 w-full rounded-sm bg-surface-elevated animate-skeleton" />
        <div className="h-3 w-full rounded-sm bg-surface-elevated animate-skeleton" />
        <div className="h-3 w-5/6 rounded-sm bg-surface-elevated animate-skeleton" />
        <div className="h-3 w-full rounded-sm bg-surface-elevated animate-skeleton" />
        <div className="h-3 w-4/5 rounded-sm bg-surface-elevated animate-skeleton" />
        <div className="h-3 w-full rounded-sm bg-surface-elevated animate-skeleton" />
        <div className="h-3 w-2/3 rounded-sm bg-surface-elevated animate-skeleton" />
      </div>
    </div>
  );
}
