'use client';

import { useState, useCallback } from 'react';
import { useCalendar } from './hooks/useCalendar.js';
import { CalendarFilters } from './subcomponents/CalendarFilters.jsx';
import { MonthView } from './subcomponents/MonthView.jsx';
import { WeekView } from './subcomponents/WeekView.jsx';
import { DayView } from './subcomponents/DayView.jsx';
import { CalendarSkeleton } from './subcomponents/CalendarSkeleton.jsx';
import { CalendarTaskPopover } from './subcomponents/CalendarTaskPopover.jsx';
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, List } from 'lucide-react';

export const CalendarView = () => {
  const {
    viewMode,
    setViewMode,
    loading,
    currentDate,
    setCurrentDate,
    monthLabel,
    weekLabel,
    dayLabel,
    monthDays,
    weekDays,
    tasksByDate,
    overdueTasks,
    unscheduledTasks,
    isSameDay,
    goToPrev,
    goToNext,
    goToToday,
    myTasksOnly,
    setMyTasksOnly,
    boardFilter,
    setBoardFilter,
    priorityFilter,
    setPriorityFilter,
    userBoards,
  } = useCalendar();

  const [selectedTask, setSelectedTask] = useState(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task);
    setPopoverOpen(true);
  }, []);

  const handleClosePopover = useCallback(() => {
    setPopoverOpen(false);
    setTimeout(() => setSelectedTask(null), 200);
  }, []);

  const handleShowMore = useCallback((year, month, day) => {
    setCurrentDate(new Date(year, month, day));
    setViewMode('day');
  }, [setCurrentDate, setViewMode]);

  const handleDateClick = useCallback((year, month, day) => {
    setCurrentDate(new Date(year, month, day));
    setViewMode('day');
  }, [setCurrentDate, setViewMode]);

  if (loading) return <CalendarSkeleton />;

  const label = viewMode === 'month' ? monthLabel : viewMode === 'week' ? weekLabel : dayLabel;

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <CalendarDays className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Calendar</h1>
            <p className="text-[10px] text-slate-400 font-mono">Schedule &amp; Deadlines</p>
          </div>
        </div>

        {/* View mode toggles */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              viewMode === 'month'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              viewMode === 'week'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="w-3 h-3" />
            Week
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              viewMode === 'day'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarDays className="w-3 h-3" />
            Day
          </button>
        </div>
      </div>

      {/* Navigation + Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date navigation */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={goToPrev}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer border-r border-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition cursor-pointer border-r border-slate-200"
          >
            Today
          </button>
          <div className="px-4 py-2 text-sm font-bold text-slate-800 min-w-[180px] text-center select-none">
            {label}
          </div>
          <button
            onClick={goToNext}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer border-l border-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right side: overdue count */}
        {overdueTasks.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-700">{overdueTasks.length} Overdue</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <CalendarFilters
        myTasksOnly={myTasksOnly}
        setMyTasksOnly={setMyTasksOnly}
        boardFilter={boardFilter}
        setBoardFilter={setBoardFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        userBoards={userBoards}
      />

      {/* Calendar grid */}
      {viewMode === 'month' && (
        <MonthView
          monthDays={monthDays}
          currentDate={currentDate}
          tasksByDate={tasksByDate}
          isSameDay={isSameDay}
          overdueTasks={overdueTasks}
          onTaskClick={handleTaskClick}
          onShowMore={handleShowMore}
          onDateClick={handleDateClick}
        />
      )}
      {viewMode === 'week' && (
        <WeekView
          weekDays={weekDays}
          tasksByDate={tasksByDate}
          isSameDay={isSameDay}
          onTaskClick={handleTaskClick}
        />
      )}
      {viewMode === 'day' && (
        <DayView
          currentDate={currentDate}
          tasksByDate={tasksByDate}
          isSameDay={isSameDay}
          overdueTasks={overdueTasks}
          unscheduledTasks={unscheduledTasks}
          onTaskClick={handleTaskClick}
        />
      )}

      {/* Popover */}
      <CalendarTaskPopover
        task={selectedTask}
        isOpen={popoverOpen}
        onClose={handleClosePopover}
      />

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legend</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[11px] text-slate-600">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[11px] text-slate-600">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[11px] text-slate-600">Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] text-slate-600">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] text-slate-600">Overdue</span>
        </div>
      </div>
    </div>
  );
};
