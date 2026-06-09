import { Compass } from 'lucide-react';

export function ActivityEmptyState() {
  return (
    <div className="py-12 text-center text-slate-400 text-xs">
      <Compass className="h-6 w-6 text-slate-300 mx-auto mb-2 animate-spin duration-10000" />
      <p>Waiting for actions... Board is quiet.</p>
    </div>
  );
}
