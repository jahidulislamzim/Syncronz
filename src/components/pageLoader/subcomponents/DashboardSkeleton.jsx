import { HeroSkeleton } from './HeroSkeleton.jsx';
import { StatsGridSkeleton } from './StatsGridSkeleton.jsx';
import { ListSkeleton } from './ListSkeleton.jsx';
import { CardSkeleton } from './CardSkeleton.jsx';

export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto w-full py-8 space-y-8">
      <HeroSkeleton />
      <StatsGridSkeleton count={6} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ListSkeleton rows={4} />
        <ListSkeleton rows={4} />
      </div>
      <CardSkeleton lines={1} />
    </div>
  );
}
