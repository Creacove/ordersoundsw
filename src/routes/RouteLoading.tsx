export function FullScreenRouteLoading() {
  return (
    <div className="w-full animate-pulse px-4 py-6 md:px-6 md:py-8 space-y-10">
      {/* Section header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 rounded-full bg-white/10" />
        <div className="h-5 w-36 rounded-lg bg-white/10" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="rounded-[1.5rem] overflow-hidden border border-white/5 bg-white/[0.03]">
            <div className="aspect-square bg-white/[0.06]" />
            <div className="p-3 space-y-2">
              <div className="h-3.5 w-3/4 rounded bg-white/[0.08]" />
              <div className="h-3 w-1/2 rounded bg-white/[0.05]" />
            </div>
          </div>
        ))}
      </div>

      {/* Second section skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-44 rounded-lg bg-white/10" />
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-[1.25rem] border border-white/5 bg-white/[0.03] p-3">
              <div className="h-12 w-12 shrink-0 rounded-[0.75rem] bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/3 rounded bg-white/[0.08]" />
                <div className="h-3 w-1/3 rounded bg-white/[0.05]" />
              </div>
              <div className="h-7 w-16 rounded-full bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InlineRouteLoading() {
  return (
    <div className="w-full animate-pulse space-y-3 px-4 py-6">
      {Array(3).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-[1.25rem] border border-white/5 bg-white/[0.03] p-3">
          <div className="h-12 w-12 shrink-0 rounded-[0.75rem] bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 rounded bg-white/[0.08]" />
            <div className="h-3 w-1/3 rounded bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}
