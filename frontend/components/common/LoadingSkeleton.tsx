/**
 * Props for mail list loading placeholders.
 */
export interface LoadingSkeletonProps {
  rows?: number
}

export function LoadingSkeleton({ rows = 6 }: LoadingSkeletonProps) {
  return (
    <div aria-hidden="true" className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-xl border border-border bg-surface p-4 dark:border-white/10 dark:bg-[#1c1c1c]">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-surface-hover dark:bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-surface-hover dark:bg-white/10" />
              <div className="h-3 w-2/3 rounded bg-surface-hover dark:bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-surface-hover dark:bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
