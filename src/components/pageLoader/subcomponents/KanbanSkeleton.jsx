import { SkeletonBlock } from './SkeletonBlock.jsx';

export function KanbanSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-[500px]">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <SkeletonBlock className="h-3 w-20 mb-2" />
            <div className="flex items-baseline justify-between">
              <SkeletonBlock className="h-6 w-10" />
              <SkeletonBlock className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-4.5 mb-6 shadow-sm">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-9 w-48 rounded-xl" />
          <SkeletonBlock className="h-9 w-32 rounded-xl" />
          <div className="flex-1" />
          <SkeletonBlock className="h-9 w-28 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-100/50 rounded-2xl border border-slate-200 p-4">
            <SkeletonBlock className="h-6 w-24 rounded-xl mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <SkeletonBlock className="h-4 w-16 rounded-md" />
                  <SkeletonBlock className="h-4 w-full" />
                  <SkeletonBlock className="h-3 w-3/4" />
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <SkeletonBlock className="h-3 w-16" />
                    <SkeletonBlock className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
