import { SkeletonBlock } from './SkeletonBlock.jsx';

export function FocusTimerSkeleton() {
  return (
    <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-emerald-500" />
          <div className="p-6 space-y-6">
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <div className="flex flex-col items-center py-4">
              <SkeletonBlock className="h-60 w-60 rounded-full" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <SkeletonBlock className="h-8 w-20 rounded-xl" />
              <SkeletonBlock className="h-8 w-20 rounded-xl" />
              <SkeletonBlock className="h-8 w-24 rounded-xl" />
            </div>
            <div className="flex items-center justify-center">
              <SkeletonBlock className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-slate-500 to-slate-600" />
          <div className="p-5 border-b border-slate-100">
            <SkeletonBlock className="h-5 w-32" />
          </div>
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                <SkeletonBlock className="h-4 w-4 rounded-full" />
                <div className="flex-1 space-y-1">
                  <SkeletonBlock className="h-4 w-40" />
                  <SkeletonBlock className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
