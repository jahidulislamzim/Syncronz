import { SkeletonBlock } from './SkeletonBlock.jsx';

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
      <div className="p-5 border-b border-slate-100">
        <SkeletonBlock className="h-4 w-24" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5">
            <SkeletonBlock className="h-2 w-2 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <SkeletonBlock className="h-4 w-48" />
              <SkeletonBlock className="h-3 w-32" />
            </div>
            <SkeletonBlock className="h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
