'use client';

import { useEffect, useState } from 'react';

function SkeletonBlock({ className }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

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

export function StatsGridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <SkeletonBlock className="h-6 w-12" />
              <SkeletonBlock className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

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

export function ManageUsersSkeleton() {
  return (
    <div className="max-w-5xl mx-auto w-full py-8 space-y-8">
      <HeroSkeleton />
      <StatsGridSkeleton count={3} />
      <CardSkeleton lines={2} />
    </div>
  );
}

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
