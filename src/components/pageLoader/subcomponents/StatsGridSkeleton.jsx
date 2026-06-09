import { SkeletonBlock } from './SkeletonBlock.jsx';

export function StatsGridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <SkeletonBlock className="h-6 w-12" />
              <SkeletonBlock className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
