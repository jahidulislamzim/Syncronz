import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { saveFocusSession, getFocusSessions } from '../lib/services.js';
import {
  Play, Pause, RotateCcw, Clock, History, CheckCircle
} from 'lucide-react';
import { FocusTimerSkeleton } from '../components/PageLoader.jsx';

function playBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 3);
  } catch {}
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const PRESETS = [25, 50];

export const FocusTimer = () => {
  const { user } = useAuth();
  const [taskName, setTaskName] = useState('');
  const [duration, setDuration] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!user) return;
    setSessionsLoading(true);
    getFocusSessions(user.uid).then(data => {
      setSessions(data);
      setSessionsLoading(false);
    });
  }, [user]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopTimer();
    setRunning(false);
    setPaused(false);
    setCompleted(false);
    setTimeLeft(duration * 60);
    elapsedRef.current = 0;
  }, [duration, stopTimer]);

  useEffect(() => {
    stopTimer();
    if (!running || paused) return;

    startTimeRef.current = Date.now() - elapsedRef.current;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, duration * 60 - Math.floor(elapsed / 1000));

      setTimeLeft(remaining);
      elapsedRef.current = elapsed;

      if (remaining <= 0) {
        stopTimer();
        setRunning(false);
        setCompleted(true);
        playBell();

        if (user) {
          const session = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
            taskName: taskName.trim() || 'Untitled Focus',
            durationMinutes: duration,
            secondsSpent: duration * 60,
            completedAt: new Date().toISOString(),
          };
          saveFocusSession(user.uid, session).then(() => {
            getFocusSessions(user.uid).then(setSessions);
          });
        }
      }
    }, 200);

    return () => stopTimer();
  }, [running, paused, duration, taskName, user, stopTimer]);

  const start = () => {
    if (paused) {
      setPaused(false);
    } else {
      if (completed) reset();
      setRunning(true);
      setCompleted(false);
    }
  };

  const pause = () => setPaused(true);

  const resume = () => setPaused(false);

  const handleReset = () => {
    stopTimer();
    setRunning(false);
    setPaused(false);
    setCompleted(false);
    setTimeLeft(duration * 60);
    elapsedRef.current = 0;
  };

  const selectPreset = (min) => {
    if (running || paused) return;
    setDuration(min);
    setTimeLeft(min * 60);
    setCustomMinutes('');
    setCompleted(false);
  };

  const handleCustom = () => {
    const val = parseInt(customMinutes, 10);
    if (isNaN(val) || val < 1 || val > 999) return;
    if (running || paused) return;
    setDuration(val);
    setTimeLeft(val * 60);
    setCompleted(false);
  };

  const dismissComplete = () => {
    setCompleted(false);
    handleReset();
  };

  const totalTime = duration * 60;
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  if (sessionsLoading) return <FocusTimerSkeleton />;

  return (
    <div className="max-w-5xl mx-auto w-full flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-hidden">
        {/* Timer Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-emerald-500 shrink-0" />
          <div className="flex-1 p-4 md:p-6 space-y-3">
            {/* Task Name */}
            <input
              type="text"
              placeholder="What are you focusing on?"
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              disabled={running}
              className="w-full text-center text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition disabled:opacity-50"
            />

            {/* Timer Display */}
            <div className="flex flex-col items-center py-1">
              <div className="relative">
                <svg width={260} height={260} className="-rotate-90">
                  <circle
                    cx={130} cy={130} r={radius}
                    fill="none" stroke="#E2E8F0" strokeWidth={6}
                  />
                  <circle
                    cx={130} cy={130} r={radius}
                    fill="none" stroke="url(#gradient)" strokeWidth={6}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-200"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">
                    {duration} min session
                  </span>
                </div>
              </div>
            </div>

            {/* Duration Presets */}
            <div className="flex items-center justify-center gap-2">
              {PRESETS.map(m => (
                <button
                  key={m}
                  onClick={() => selectPreset(m)}
                  disabled={running}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    duration === m && !customMinutes
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {m} min
                </button>
              ))}
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={999}
                  placeholder="Custom"
                  value={customMinutes}
                  onChange={e => setCustomMinutes(e.target.value)}
                  onBlur={handleCustom}
                  onKeyDown={e => e.key === 'Enter' && handleCustom()}
                  disabled={running}
                  className="w-16 text-center text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition disabled:opacity-40"
                />
                <span className="text-[10px] text-slate-400 font-medium">min</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {!running && !paused ? (
                <button
                  onClick={start}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  <Play className="w-4.5 h-4.5 fill-white" />
                  {completed ? 'Start New' : 'Start'}
                </button>
              ) : paused ? (
                <button
                  onClick={resume}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-sm font-bold transition cursor-pointer shadow-lg shadow-emerald-600/15"
                >
                  <Play className="w-4.5 h-4.5 fill-white" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={pause}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition cursor-pointer shadow-lg shadow-amber-500/15"
                >
                  <Pause className="w-4.5 h-4.5 fill-white" />
                  Pause
                </button>
              )}
              <button
                onClick={handleReset}
                disabled={!running && !paused && !completed}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="h-1 bg-gradient-to-r from-slate-500 to-slate-600 shrink-0" />
          <div className="p-5 border-b border-slate-100 flex items-center gap-3 shrink-0">
            <History className="w-4.5 h-4.5 text-slate-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Session History</h2>
              <p className="text-xs text-slate-400">{sessions.length} completed</p>
            </div>
          </div>
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto subtle-scroll">
            {sessions.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-200">
                  <Clock className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-900">No sessions yet</p>
                <p className="text-xs text-slate-400 mt-1">Complete a focus session to see it here</p>
              </div>
            ) : (
              sessions.map(s => (
                <div key={s.id} className="px-5 py-3.5 hover:bg-slate-50/50 transition">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{s.taskName}</p>
                      <p className="text-xs text-slate-400">
                        {s.durationMinutes} min &middot; {new Date(s.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Completion overlay */}
      {completed && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center space-y-5 border border-slate-200">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-slate-900">Focus Session Complete</h2>
              <p className="text-sm text-slate-500">
                {taskName.trim() || 'Untitled Focus'} &middot; {duration} min
              </p>
            </div>
            <button
              onClick={dismissComplete}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition cursor-pointer shadow-lg shadow-indigo-600/15"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
