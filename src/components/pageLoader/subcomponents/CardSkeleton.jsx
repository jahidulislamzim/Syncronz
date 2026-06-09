import { SkeletonBlock } from './SkeletonBlock.jsx';

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="h-1 bg-slate-200" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-9 w-9 rounded-xl" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-3 w-48" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonBlock key={i} className={`h-12 w-full ${i === lines - 1 ? 'w-3/4' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
