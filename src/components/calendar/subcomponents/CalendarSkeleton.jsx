import { SkeletonBlock } from '../../pageLoader/subcomponents/SkeletonBlock.jsx';

export function CalendarSkeleton() {
  return (
    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-8 w-48 rounded-xl" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-8 w-20 rounded-xl" />
          <SkeletonBlock className="h-8 w-20 rounded-xl" />
          <SkeletonBlock className="h-8 w-20 rounded-xl" />
        </div>
      </div>
      {/* Filters skeleton */}
      <SkeletonBlock className="h-10 w-full rounded-xl" />
      {/* Calendar grid skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-8 m-2 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[90px] border-b border-r border-slate-100 p-1.5">
              <SkeletonBlock className="h-5 w-5 rounded-full mb-1" />
              <SkeletonBlock className="h-3 w-full rounded mb-0.5" />
              <SkeletonBlock className="h-3 w-3/4 rounded mb-0.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
