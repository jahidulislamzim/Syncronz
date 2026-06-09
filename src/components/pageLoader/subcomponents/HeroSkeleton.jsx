import { SkeletonBlock } from './SkeletonBlock.jsx';

export function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-10">
      <div className="relative z-10">
        <div className="flex items-start gap-5">
          <SkeletonBlock className="h-12 w-12 rounded-2xl" />
          <div className="space-y-3 flex-1">
            <SkeletonBlock className="h-6 w-64" />
            <SkeletonBlock className="h-4 w-96 max-w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
