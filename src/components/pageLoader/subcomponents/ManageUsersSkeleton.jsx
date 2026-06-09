import { HeroSkeleton } from './HeroSkeleton.jsx';
import { StatsGridSkeleton } from './StatsGridSkeleton.jsx';
import { CardSkeleton } from './CardSkeleton.jsx';

export function ManageUsersSkeleton() {
  return (
    <div className="max-w-5xl mx-auto w-full py-8 space-y-8">
      <HeroSkeleton />
      <StatsGridSkeleton count={3} />
      <CardSkeleton lines={2} />
    </div>
  );
}
