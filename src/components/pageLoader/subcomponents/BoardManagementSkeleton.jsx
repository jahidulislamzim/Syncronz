import { HeroSkeleton } from './HeroSkeleton.jsx';
import { StatsGridSkeleton } from './StatsGridSkeleton.jsx';
import { CardSkeleton } from './CardSkeleton.jsx';

export function BoardManagementSkeleton() {
  return (
    <div className="max-w-5xl mx-auto w-full py-8 space-y-8">
      <HeroSkeleton />
      <StatsGridSkeleton count={4} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={2} />
      </div>
    </div>
  );
}
