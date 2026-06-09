import { KanbanSkeleton } from './KanbanSkeleton.jsx';
import { CardSkeleton } from './CardSkeleton.jsx';

export function BoardDetailSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:space-x-8 space-y-8 lg:space-y-0 h-full">
      <div className="flex-1">
        <KanbanSkeleton />
      </div>
      <div className="w-full lg:w-[280px] shrink-0 space-y-6">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={4} />
      </div>
    </div>
  );
}
