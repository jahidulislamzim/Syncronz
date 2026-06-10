'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { db } from '../../../lib/firebase/client.js';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { isDeadlineOver } from '../../kanban/utils/helpers.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const days = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, month: month - 1, year, isCurrent: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, month, year, isCurrent: true });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, month: month + 1, year, isCurrent: false });
  }

  return days;
}

function getWeekDays(date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), date: new Date(d) });
  }
  return days;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export const useCalendar = () => {
  const { user, profile } = useAuth();
  const [allBoards, setAllBoards] = useState([]);
  const [boardTasks, setBoardTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [boardFilter, setBoardFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'boards'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.boardId && !data.isArchived) list.push(data);
      });
      setAllBoards(list);
    });
    return () => unsub();
  }, [user]);

  const userBoards = useMemo(() => {
    return allBoards.filter(b =>
      profile?.isAdmin ||
      b.creatorId === user?.uid ||
      profile?.joinedBoards?.includes(b.boardId)
    );
  }, [allBoards, profile, user]);

  useEffect(() => {
    if (userBoards.length === 0) {
      setBoardTasks({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubs = [];

    userBoards.forEach(board => {
      const unsub = onSnapshot(
        query(collection(db, 'boards', board.boardId, 'tasks')),
        (snap) => {
          const tasks = [];
          snap.forEach(docSnap => {
            const data = docSnap.data();
            tasks.push({ ...data, boardName: board.name });
          });
          setBoardTasks(prev => ({ ...prev, [board.boardId]: tasks }));
        },
        (err) => {
          console.error(`Error fetching tasks for board ${board.boardId}:`, err);
        }
      );
      unsubs.push(unsub);
    });

    const timer = setTimeout(() => setLoading(false), 500);

    return () => {
      unsubs.forEach(u => u());
      clearTimeout(timer);
    };
  }, [userBoards]);

  const allTasks = useMemo(() => {
    const tasks = [];
    Object.values(boardTasks).forEach(taskList => {
      tasks.push(...taskList);
    });
    return tasks;
  }, [boardTasks]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      if (myTasksOnly) {
        const isAssigned = task.assigneeId === user?.uid ||
          task.assignees?.some(a => a.uid === user?.uid);
        const isCreator = task.creatorId === user?.uid;
        if (!isAssigned && !isCreator) return false;
      }
      if (boardFilter !== 'all' && task.boardId !== boardFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      return true;
    });
  }, [allTasks, myTasksOnly, boardFilter, priorityFilter, user]);

  const tasksByDate = useMemo(() => {
    const map = {};
    filteredTasks.forEach(task => {
      if (task.dueDate) {
        if (!map[task.dueDate]) map[task.dueDate] = [];
        map[task.dueDate].push(task);
      }
    });
    return map;
  }, [filteredTasks]);

  const overdueTasks = useMemo(() => {
    return filteredTasks.filter(task =>
      task.dueDate && isDeadlineOver(task.dueDate, task.status)
    );
  }, [filteredTasks]);

  const unscheduledTasks = useMemo(() => {
    return filteredTasks.filter(task => !task.dueDate);
  }, [filteredTasks]);

  const goToPrev = useCallback(() => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
      else if (viewMode === 'week') d.setDate(d.getDate() - 7);
      else d.setDate(d.getDate() - 1);
      return d;
    });
  }, [viewMode]);

  const goToNext = useCallback(() => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
      else if (viewMode === 'week') d.setDate(d.getDate() + 7);
      else d.setDate(d.getDate() + 1);
      return d;
    });
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const monthLabel = useMemo(() => {
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [currentDate]);

  const weekLabel = useMemo(() => {
    const start = getWeekDays(currentDate)[0];
    const end = getWeekDays(currentDate)[6];
    const sd = new Date(start.year, start.month, start.day);
    const ed = new Date(end.year, end.month, end.day);
    if (sd.getMonth() === ed.getMonth()) {
      return `${MONTHS[sd.getMonth()]} ${sd.getDate()} - ${ed.getDate()}, ${ed.getFullYear()}`;
    }
    return `${MONTHS[sd.getMonth()]} ${sd.getDate()} - ${MONTHS[ed.getMonth()]} ${ed.getDate()}, ${ed.getFullYear()}`;
  }, [currentDate]);

  const dayLabel = useMemo(() => {
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  }, [currentDate]);

  const monthDays = useMemo(() => {
    return getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return getWeekDays(currentDate);
  }, [currentDate]);

  return {
    currentDate,
    setCurrentDate,
    viewMode,
    loading,
    allTasks: filteredTasks,
    tasksByDate,
    overdueTasks,
    unscheduledTasks,
    userBoards,
    setViewMode,
    goToPrev,
    goToNext,
    goToToday,
    monthLabel,
    weekLabel,
    dayLabel,
    monthDays,
    weekDays,
    boardFilter,
    setBoardFilter,
    priorityFilter,
    setPriorityFilter,
    myTasksOnly,
    setMyTasksOnly,
    isSameDay,
    DAYS,
    MONTHS,
  };
};
