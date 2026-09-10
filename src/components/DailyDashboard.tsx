import React, { useState, useEffect } from 'react';
import { 
  format, 
  addDays, 
  subDays, 
  differenceInDays, 
  differenceInMonths,
  intervalToDuration,
  isSameDay,
  isBefore,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Save,
  Trash2,
  Plus,
  Sun,
  Moon,
  Monitor,
  MessageCircle,
  Home,
  FileText,
  X,
  ArrowRight,
  Clock,
  Sparkles,
  Settings,
  RotateCcw,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { AppState, CalendarEvent, DayRating, NoteEntry, EventType } from '../types';
import { cn, toLocalISOString } from '../lib/utils';
import { CelestialBackground } from './CelestialBackground';
import { getSkyState } from '../lib/celestial';

const EVENT_TYPES: { type: EventType; label: string; icon: string; badgeClass: string }[] = [
  { type: 'Birthday', label: 'Birthday', icon: '🎂', badgeClass: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-900' },
  { type: 'Milestone', label: 'Milestone', icon: '🏆', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900' },
  { type: 'Goal', label: 'Goal', icon: '🎯', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' },
  { type: 'Deadline', label: 'Deadline', icon: '⏳', badgeClass: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900' },
  { type: 'Exam', label: 'Exam', icon: '📝', badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900' },
  { type: 'Anniversary', label: 'Anniversary', icon: '💍', badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900' },
  { type: 'Other', label: 'Other', icon: '📌', badgeClass: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700' }
];

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function formatTimeDisplay(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
  } catch {
    return timeStr;
  }
}

interface DailyDashboardProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  updateNote: (date: string, note: NoteEntry) => void;
  updateDayRating: (date: string, rating: DayRating) => void;
  updateRemark: (date: string, remark: 'yes' | 'no' | null) => void;
  addEvent: (date: string, event: Omit<CalendarEvent, 'id'>) => void;
  removeEvent: (date: string, id: string) => void;
  updateLifeExpectancy: (years: number) => void;
  toggleTheme: () => void;
  updateDob?: (dob: string) => void;
}

function LiveClock({ onOpenCelestial }: { onOpenCelestial?: () => void }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sky = getSkyState(time);

  return (
    <div 
      onClick={onOpenCelestial}
      className="py-6 text-center flex flex-col items-center justify-center cursor-pointer group select-none"
      title="Click to view real-time celestial sky and moon phase"
    >
      <div className="text-4xl md:text-5xl font-mono tracking-widest font-light text-stone-900 dark:text-stone-100 drop-shadow-sm group-hover:scale-[1.02] transition-transform">
        {format(time, 'HH : mm : ss')}
      </div>
      <div className="mt-2.5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-white/80 dark:bg-stone-900/80 backdrop-blur-md text-stone-700 dark:text-stone-300 border border-stone-200/70 dark:border-stone-800/70 shadow-xs group-hover:border-stone-400 dark:group-hover:border-stone-600 transition-colors">
        <span>{sky.isDaytime ? '☀️' : '🌙'} {sky.periodLabel}</span>
        <span className="opacity-40">•</span>
        <span>{sky.season === 'summer' ? 'Summer (Night: 6:45 PM)' : 'Winter (Night: 6:00 PM)'}</span>
        <span className="opacity-40">•</span>
        <span>Moon: {sky.moonInfo.phaseName} (Day {sky.moonInfo.fortnightDay}/15)</span>
        <Sparkles className="w-3 h-3 text-amber-500 opacity-80" />
      </div>
    </div>
  );
}

export function DailyDashboard({
  appState,
  setAppState,
  updateNote,
  updateDayRating,
  updateRemark,
  addEvent,
  removeEvent,
  updateLifeExpectancy,
  toggleTheme,
  updateDob
}: DailyDashboardProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Navigation Tabs and Flows
  const [activeTab, setActiveTab] = useState<'home' | 'remark' | 'note'>('home');
  const [writingMode, setWritingMode] = useState(false);
  const [remarkStep, setRemarkStep] = useState<'ask' | 'yes' | 'no'>('ask');
  const [selectedNoteForView, setSelectedNoteForView] = useState<{date: string, note: NoteEntry, remark: 'yes' | 'no' | null} | null>(null);

  // Note temp state
  const [tempNoteTitle, setTempNoteTitle] = useState('');
  const [tempNoteContent, setTempNoteContent] = useState('');
  
  // Modals & Dialogs
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(currentDate);
  const [isNewEntryPromptOpen, setIsNewEntryPromptOpen] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState(toLocalISOString(new Date()));
  const [isCelestialModalOpen, setIsCelestialModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isDobModalOpen, setIsDobModalOpen] = useState(false);
  const [isRemarkSettingsOpen, setIsRemarkSettingsOpen] = useState(false);
  const [tempRemarkQuestion, setTempRemarkQuestion] = useState(appState.remarkQuestion || 'Was the day yours?');
  const [currentSkyState, setCurrentSkyState] = useState<any>(null);

  // Event Creation State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>('Milestone');
  const [newEventDate, setNewEventDate] = useState(toLocalISOString(currentDate));
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventNote, setNewEventNote] = useState('');

  // Temp DOB State
  const [tempDob, setTempDob] = useState(appState.dob || '2000-01-01');

  const dobDate = parseISO(appState.dob!);
  const todayStr = toLocalISOString(currentDate);

  // Sync temp note when date changes
  useEffect(() => {
    const currentData = appState.notes[todayStr];
    const title = typeof currentData === 'string' ? '' : currentData?.title || '';
    const content = typeof currentData === 'string' ? currentData : currentData?.content || '';
    
    setTempNoteTitle(title);
    setTempNoteContent(content);
    setWritingMode(false);
  }, [todayStr, appState.notes]);

  // Keep calendar view in sync when opening
  useEffect(() => {
    if (isCalendarOpen) {
      setCalendarViewDate(currentDate);
    }
  }, [isCalendarOpen, currentDate]);

  // Update temp remark question if appState changes
  useEffect(() => {
    if (appState.remarkQuestion) {
      setTempRemarkQuestion(appState.remarkQuestion);
    }
  }, [appState.remarkQuestion]);

  const handlePrevDay = () => {
    const prevDay = subDays(currentDate, 1);
    if (!isBefore(prevDay, dobDate)) {
      setCurrentDate(prevDay);
    }
  };

  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // --- Calculations ---
  
  // Exact Age
  const ageDuration = intervalToDuration({ start: dobDate, end: currentDate });
  const totalDaysLived = differenceInDays(currentDate, dobDate);
  
  // Next Birthday
  const nextBirthday = new Date(dobDate);
  nextBirthday.setFullYear(currentDate.getFullYear());
  if (isBefore(nextBirthday, currentDate) && !isSameDay(nextBirthday, currentDate)) {
    nextBirthday.setFullYear(currentDate.getFullYear() + 1);
  }
  const daysUntilBirthday = differenceInDays(nextBirthday, currentDate);

  // Progress
  const startYear = startOfYear(currentDate);
  const endYear = endOfYear(currentDate);
  const yearProgress = (differenceInDays(currentDate, startYear) / differenceInDays(endYear, startYear)) * 100;

  const startMonth = startOfMonth(currentDate);
  const endMonth = endOfMonth(currentDate);
  const monthProgress = (differenceInDays(currentDate, startMonth) / differenceInDays(endMonth, startMonth)) * 100;

  const dayRating = appState.dayRatings[todayStr] || null;
  const userEvents = appState.events[todayStr] || [];

  // Life Milestones for this date (Birthdays, 1000-day marks, New Year)
  const milestoneEvents: CalendarEvent[] = [];
  if (currentDate.getMonth() === dobDate.getMonth() && currentDate.getDate() === dobDate.getDate()) {
    milestoneEvents.push({
      id: `birthday-${currentDate.getFullYear()}`,
      title: `Birthday: Level ${ageDuration.years || 0} Passed! 🎂`,
      type: 'Birthday',
      date: todayStr,
      note: `Completed orbit #${ageDuration.years || 0} around the Sun.`
    });
  }
  if (totalDaysLived > 0 && totalDaysLived % 1000 === 0) {
    milestoneEvents.push({
      id: `milestone-${totalDaysLived}`,
      title: `Life Milestone: Day ${totalDaysLived.toLocaleString()} on Earth! 🏆`,
      type: 'Milestone',
      date: todayStr,
      note: `You have completed ${totalDaysLived.toLocaleString()} consecutive days on Earth.`
    });
  }
  if (currentDate.getMonth() === 0 && currentDate.getDate() === 1) {
    milestoneEvents.push({
      id: `newyear-${currentDate.getFullYear()}`,
      title: `New Year ${currentDate.getFullYear()} 🌟`,
      type: 'Milestone',
      date: todayStr,
      note: `First day of year ${currentDate.getFullYear()}.`
    });
  }

  const events: CalendarEvent[] = [
    ...milestoneEvents.filter(m => !userEvents.some(u => u.title === m.title)),
    ...userEvents
  ];

  // --- Render Custom Modals ---
  const renderCalendarModal = () => {
    const monthStart = startOfMonth(calendarViewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
      <AnimatePresence>
        {isCalendarOpen && (
          <div className="fixed inset-0 z-[100] bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-xl w-full max-w-sm border border-stone-200 dark:border-stone-800"
            >
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setCalendarViewDate(subMonths(calendarViewDate, 1))} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-serif font-medium">
                  {format(calendarViewDate, 'MMMM yyyy')}
                </h3>
                <button onClick={() => setCalendarViewDate(addMonths(calendarViewDate, 1))} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-stone-500">
                {weekDays.map(d => <div key={d}>{d}</div>)}
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarDays.map((day, i) => {
                  const dayStr = toLocalISOString(day);
                  const remark = appState.remarks?.[dayStr];
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isSelected = isSameDay(day, currentDate);
                  const isBeforeDob = isBefore(day, dobDate) && !isSameDay(day, dobDate);
                  
                  let remarkColor = "";
                  if (remark === 'yes') remarkColor = "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 font-bold border border-green-500/50";
                  else if (remark === 'no') remarkColor = "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-bold border border-red-500/50";
                  
                  return (
                    <button
                      key={i}
                      disabled={isBeforeDob}
                      onClick={() => {
                        setCurrentDate(day);
                        setIsCalendarOpen(false);
                      }}
                      className={cn(
                        "w-10 h-10 mx-auto flex items-center justify-center rounded-full text-sm transition-all border border-transparent",
                        !isCurrentMonth && "opacity-30",
                        isBeforeDob && "opacity-20 cursor-not-allowed",
                        isSelected && !remark && "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900",
                        remarkColor,
                        !isSelected && !remark && !isBeforeDob && "hover:bg-stone-100 dark:hover:bg-stone-800"
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-6 flex items-center justify-between gap-2 flex-wrap pt-4 border-t border-stone-100 dark:border-stone-800">
                <button 
                  onClick={() => {
                    setNewEventDate(todayStr);
                    setIsCalendarOpen(false);
                    setIsAddEventModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Event</span>
                </button>
                <button 
                  onClick={() => setIsCalendarOpen(false)}
                  className="px-5 py-2 text-sm font-medium rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  const renderNewEntryPromptModal = () => (
    <AnimatePresence>
      {isNewEntryPromptOpen && (
        <div className="fixed inset-0 z-[100] bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-xl w-full max-w-sm border border-stone-200 dark:border-stone-800"
          >
            <h3 className="text-xl font-serif mb-2">New Journal Entry</h3>
            <p className="text-sm text-stone-500 mb-6">Which date would you like to write about?</p>
            <input 
              type="date" 
              value={newEntryDate} 
              onChange={(e) => setNewEntryDate(e.target.value)} 
              min={toLocalISOString(dobDate)}
              className="w-full p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 transition-colors"
            />
            <div className="flex gap-3 mt-6 justify-end">
              <button 
                onClick={() => setIsNewEntryPromptOpen(false)} 
                className="px-5 py-2.5 text-sm font-medium rounded-full text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const d = parseISO(newEntryDate);
                  if (!isNaN(d.getTime())) setCurrentDate(d);
                  setIsNewEntryPromptOpen(false);
                  setWritingMode(true);
                }} 
                className="px-5 py-2.5 text-sm font-medium rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-sm"
              >
                Start Writing
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderAddEventModal = () => (
    <AnimatePresence>
      {isAddEventModalOpen && (
        <div className="fixed inset-0 z-[105] bg-stone-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-7 shadow-2xl w-full max-w-md border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100"
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 mb-5">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif text-lg font-medium">Schedule Event</h3>
              </div>
              <button
                onClick={() => setIsAddEventModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newEventTitle.trim()) return;
                const targetDate = newEventDate || todayStr;
                addEvent(targetDate, {
                  title: newEventTitle.trim(),
                  type: newEventType,
                  date: targetDate,
                  time: newEventTime || undefined,
                  note: newEventNote.trim() || undefined
                });
                setNewEventTitle('');
                setNewEventTime('');
                setNewEventNote('');
                setIsAddEventModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master degree thesis submission"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                    Category
                  </label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as EventType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-medium"
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t.type} value={t.type}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                    Time (optional)
                  </label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Note (optional, under 60 words)
                  </label>
                  <span className="text-[11px] text-stone-400 font-mono">
                    {countWords(newEventNote)} / 60 words
                  </span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Short note or reminder..."
                  value={newEventNote}
                  onChange={(e) => {
                    const text = e.target.value;
                    if (countWords(text) <= 60) {
                      setNewEventNote(text);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-full text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newEventTitle.trim()}
                  className="px-5 py-2 text-xs font-semibold rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 disabled:opacity-50 transition-colors shadow-sm"
                >
                  Save Event
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderDobModal = () => (
    <AnimatePresence>
      {isDobModalOpen && (
        <div className="fixed inset-0 z-[105] bg-stone-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl w-full max-w-sm border border-stone-200 dark:border-stone-800"
          >
            <h3 className="text-xl font-serif mb-2">Update Date of Birth</h3>
            <p className="text-xs text-stone-500 mb-5">Recalculates your exact life levels and days lived.</p>
            <input
              type="date"
              value={tempDob}
              onChange={(e) => setTempDob(e.target.value)}
              className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 text-sm"
            />
            <div className="flex gap-2.5 mt-6 justify-end">
              <button
                onClick={() => setIsDobModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-full text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (tempDob && updateDob) {
                    updateDob(tempDob);
                  }
                  setIsDobModalOpen(false);
                }}
                className="px-5 py-2 text-xs font-semibold rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );


  // --- Remark Settings Modal ---
  const renderRemarkSettingsModal = () => {
    const currentRemark = appState.remarks?.[todayStr] || null;
    const presets = [
      "Was the day yours?",
      "Did you win the day?",
      "Did you make progress today?",
      "Are you satisfied with today?",
      "Did you stay disciplined today?"
    ];

    return (
      <AnimatePresence>
        {isRemarkSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-100">
                      Remark Settings
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {format(currentDate, 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRemarkSettingsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Part 1: Change current day's Remark verdict */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Day's Remark Verdict
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateRemark(todayStr, 'yes');
                      setRemarkStep('yes');
                    }}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border font-medium text-xs flex items-center justify-center gap-1.5 transition-all",
                      currentRemark === 'yes'
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-emerald-500 text-stone-700 dark:text-stone-300"
                    )}
                  >
                    <span>🔥 YES</span>
                    {currentRemark === 'yes' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateRemark(todayStr, 'no');
                      setRemarkStep('no');
                    }}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border font-medium text-xs flex items-center justify-center gap-1.5 transition-all",
                      currentRemark === 'no'
                        ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                        : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-rose-500 text-stone-700 dark:text-stone-300"
                    )}
                  >
                    <span>🥲 NO</span>
                    {currentRemark === 'no' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateRemark(todayStr, null);
                      setRemarkStep('ask');
                    }}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border font-medium text-xs flex items-center justify-center gap-1.5 transition-all",
                      currentRemark === null
                        ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 border-transparent shadow-sm"
                        : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:bg-stone-100 text-stone-500"
                    )}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Part 2: Change Remark Question */}
              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Custom Remark Question
                </label>
                <input
                  type="text"
                  value={tempRemarkQuestion}
                  onChange={(e) => setTempRemarkQuestion(e.target.value)}
                  placeholder="e.g. Was the day yours?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />

                <div className="pt-1">
                  <span className="text-[11px] text-stone-400 block mb-1.5">Quick Inspiration:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTempRemarkQuestion(p)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] border transition-colors",
                          tempRemarkQuestion === p
                            ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-transparent font-medium"
                            : "bg-stone-100 dark:bg-stone-800 border-transparent hover:border-stone-300 text-stone-600 dark:text-stone-300"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsRemarkSettingsOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-full text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const finalQ = tempRemarkQuestion.trim() || 'Was the day yours?';
                    setAppState(prev => ({ ...prev, remarkQuestion: finalQ }));
                    setIsRemarkSettingsOpen(false);
                  }}
                  className="px-5 py-2 text-xs font-semibold rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  // --- Rendering Sub-Views ---

  const renderRemarkFlow = () => {
    const currentRemark = appState.remarks?.[todayStr] || null;
    const remarkQuestion = appState.remarkQuestion || "Was the day yours?";

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Control Bar with Date & Settings Button */}
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-white/70 dark:bg-stone-900/70 border border-stone-200/60 dark:border-stone-800/60 text-stone-600 dark:text-stone-400 backdrop-blur-md">
            📅 {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </span>

          <button
            onClick={() => {
              setTempRemarkQuestion(remarkQuestion);
              setIsRemarkSettingsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors shadow-xs"
            title="Change question or modify remark"
          >
            <Settings className="w-3.5 h-3.5 text-amber-500" />
            <span>Remark Settings</span>
          </button>
        </div>

        {/* Main Remark Card: YES or NO Part, or Initial Question */}
        <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-stone-200/60 dark:border-stone-800/60 shadow-lg transition-colors">
          <AnimatePresence mode="wait">
            {currentRemark ? (
              /* THE YES OR NO PART */
              <motion.div
                key={`verdict-${currentRemark}`}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-stone-400">
                    Daily Question
                  </span>
                  <p className="text-base sm:text-lg font-serif italic text-stone-700 dark:text-stone-300">
                    "{remarkQuestion}"
                  </p>
                </div>

                {currentRemark === 'yes' ? (
                  <div className="flex flex-col items-center space-y-4">
                    {/* Big YES Emblem */}
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400/20 to-green-500/20 border-2 border-emerald-500/60 flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/15">
                      <span className="text-3xl font-black tracking-wider">YES</span>
                      <span className="text-lg">🔥</span>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">
                        LET'S GOOOOO.... 🔥
                      </h2>
                      <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                        The day was yours! You showed up, owned your hours, and conquered today.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    {/* Big NO Emblem */}
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-400/20 to-red-500/20 border-2 border-rose-500/60 flex flex-col items-center justify-center text-rose-600 dark:text-rose-400 shadow-xl shadow-rose-500/15">
                      <span className="text-3xl font-black tracking-wider">NO</span>
                      <span className="text-lg">🥲</span>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">
                        Oooo... it's so sad 🥲
                      </h2>
                      <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                        Not quite your day, but remember: progress isn't linear. Reset tonight and attack tomorrow with fresh energy.
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions inside the Yes or No Part */}
                <div className="w-full pt-4 space-y-3 max-w-sm">
                  <button
                    onClick={() => {
                      setActiveTab('note');
                      setWritingMode(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{currentRemark === 'yes' ? 'Write Daily Note' : 'Tell Me What Happened'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateRemark(todayStr, currentRemark === 'yes' ? 'no' : 'yes')}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-center"
                    >
                      Switch to {currentRemark === 'yes' ? 'NO 🥲' : 'YES 🔥'}
                    </button>

                    <button
                      onClick={() => {
                        setTempRemarkQuestion(remarkQuestion);
                        setIsRemarkSettingsOpen(true);
                      }}
                      className="py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5 text-amber-500" />
                      <span>Change</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* THE UNANSWERED REMARK QUESTION */
              <motion.div
                key="unanswered-ask"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center text-center space-y-8"
              >
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                    <Sparkles className="w-3 h-3" /> Daily Remark
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-serif tracking-tight leading-tight text-stone-900 dark:text-stone-100">
                    {remarkQuestion}
                  </h2>
                  <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                    Take a moment to reflect on your day and record your verdict.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
                  <button
                    onClick={() => {
                      updateRemark(todayStr, 'yes');
                      setRemarkStep('yes');
                    }}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold tracking-wider text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    <span>YES</span>
                    <span>🔥</span>
                  </button>

                  <button
                    onClick={() => {
                      updateRemark(todayStr, 'no');
                      setRemarkStep('no');
                    }}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold tracking-wider text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
                  >
                    <span>NO</span>
                    <span>🥲</span>
                  </button>
                </div>

                <p className="text-xs text-stone-400">
                  You can change this prompt or your answer at any time via Remark Settings.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderNoteList = () => {
    const allNotes = Object.entries(appState.notes)
      .filter(([_, data]) => {
        const text = typeof data === 'string' ? data : data.content;
        return text.trim().length > 0;
      })
      .sort((a, b) => b[0].localeCompare(a[0]));

    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center mb-8">
           <h2 className="text-3xl font-serif">All Notes</h2>
           <button 
             onClick={() => {
               setNewEntryDate(todayStr);
               setIsNewEntryPromptOpen(true);
             }} 
             className="flex items-center gap-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
           >
              <Plus className="w-4 h-4" /> New Entry
           </button>
         </div>

         <div className="space-y-3">
          {allNotes.map(([dateStr, noteData]) => {
            const title = typeof noteData === 'string' ? 'Untitled Note' : noteData.title || 'Untitled Note';
            return (
              <button
                key={dateStr}
                onClick={() => {
                  setSelectedNoteForView({
                    date: dateStr,
                    note: typeof noteData === 'string' ? { title: 'Untitled Note', content: noteData } : noteData,
                    remark: (appState.remarks || {})[dateStr] || null
                  });
                }}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600 shadow-sm hover:shadow transition-all text-left group"
              >
                <span className="font-semibold text-stone-800 dark:text-stone-200 group-hover:text-stone-900 dark:group-hover:text-stone-50 truncate mr-4">
                  {title}
                </span>
                <span className="text-sm font-medium text-stone-400 dark:text-stone-500 whitespace-nowrap">
                  {format(parseISO(dateStr), 'dd MMM yyyy')}
                </span>
              </button>
            );
          })}
          {allNotes.length === 0 && (
            <p className="text-center text-stone-500 italic py-10">No notes written yet. Start your journal today.</p>
          )}
        </div>

        {/* Slide-open panel */}
        <AnimatePresence>
          {selectedNoteForView && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[60] bg-stone-50 dark:bg-stone-950 p-6 md:p-8 flex flex-col overflow-y-auto"
            >
              <div className="max-w-3xl mx-auto w-full flex-1 pt-12 md:pt-0">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-serif text-stone-900 dark:text-stone-100 mb-2">{selectedNoteForView.note.title || 'Untitled Note'}</h2>
                    <p className="text-stone-500 dark:text-stone-400 font-medium">{format(parseISO(selectedNoteForView.date), 'MMMM d, yyyy')}</p>
                  </div>
                  <button onClick={() => setSelectedNoteForView(null)} className="p-3 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 bg-stone-100 dark:bg-stone-900 transition-colors shadow-sm">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                {selectedNoteForView.remark && (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8 text-sm font-semibold bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                    Day Assessment: 
                    {selectedNoteForView.remark === 'yes' ? (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">Yes 🔥</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 flex items-center gap-1">No 🥲</span>
                    )}
                  </div>
                )}

                <div className="prose dark:prose-invert max-w-none font-serif text-lg leading-relaxed whitespace-pre-wrap text-stone-700 dark:text-stone-300">
                  {selectedNoteForView.note.content}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const renderWritingPage = () => (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-serif">Writing for {format(currentDate, 'MMMM d, yyyy')}</h2>
        <button 
          onClick={() => {
            setWritingMode(false);
            if (activeTab === 'remark') setRemarkStep('ask');
          }}
          className="px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-800 text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-6">
        <input
          type="text"
          placeholder="Note Title..."
          value={tempNoteTitle}
          onChange={(e) => setTempNoteTitle(e.target.value)}
          className="w-full text-2xl md:text-3xl font-serif bg-transparent border-b border-stone-200 dark:border-stone-800 pb-3 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-colors placeholder:text-stone-300 dark:placeholder:text-stone-700"
        />
        <textarea
          value={tempNoteContent}
          onChange={(e) => setTempNoteContent(e.target.value)}
          placeholder="Write your entry here..."
          className="w-full min-h-[40vh] text-lg font-serif bg-transparent focus:outline-none resize-y placeholder:text-stone-300 dark:placeholder:text-stone-700 leading-relaxed"
        />
        <div className="flex justify-end pt-4">
          <button
            onClick={() => {
              updateNote(todayStr, { title: tempNoteTitle, content: tempNoteContent });
              setWritingMode(false);
              // Always redirect to Note list if it was a remark, so they can see their entry
              if (activeTab === 'remark') {
                setActiveTab('note');
              }
            }}
            className="flex items-center gap-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-8 py-3 rounded-full font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-md"
          >
            <Save className="w-5 h-5" />
            Save Note
          </button>
        </div>
      </div>
    </div>
  );

  const renderHome = () => {
    const realTodayStr = toLocalISOString(new Date());

    return (
      <div className="space-y-10">
        
        {/* Live Clock injected precisely above the dashboard metrics */}
        <LiveClock onOpenCelestial={() => setIsCelestialModalOpen(true)} />

        {/* Life Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard title="Age">
            <div className="font-medium text-lg flex items-center justify-between">
              <span>{ageDuration.years || 0}y, {ageDuration.months || 0}m, {ageDuration.days || 0}d</span>
              {updateDob && (
                <button
                  onClick={() => setIsDobModalOpen(true)}
                  className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                  title="Edit Birthday / DOB"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </StatCard>
          <StatCard title="Total Days Lived">
            <div className="font-medium text-lg">
              {totalDaysLived.toLocaleString()}
            </div>
          </StatCard>
          <StatCard title="Weeks Lived">
            <div className="font-medium text-lg">
              {Math.floor(totalDaysLived / 7).toLocaleString()}
            </div>
          </StatCard>
          <StatCard title="Months Lived">
            <div className="font-medium text-lg">
              {(differenceInMonths(currentDate, dobDate)).toLocaleString()}
            </div>
          </StatCard>
          <StatCard title="Next Birthday">
            <div className="font-medium text-lg">
              {daysUntilBirthday} days
            </div>
          </StatCard>
          <StatCard title="Year Day">
            <div className="font-medium text-lg">
              Day {differenceInDays(currentDate, startYear) + 1}
            </div>
          </StatCard>
          <StatCard title="Year Progress">
            <div className="flex flex-col gap-2">
              <span className="font-medium text-lg">{yearProgress.toFixed(1)}%</span>
              <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-stone-900 dark:bg-stone-100 rounded-full" style={{ width: `${yearProgress}%` }} />
              </div>
            </div>
          </StatCard>
          <StatCard title="Month Progress">
            <div className="flex flex-col gap-2">
              <span className="font-medium text-lg">{monthProgress.toFixed(1)}%</span>
              <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-stone-900 dark:bg-stone-100 rounded-full" style={{ width: `${monthProgress}%` }} />
              </div>
            </div>
          </StatCard>
        </section>

        {/* Main Content Layout: Important Events & Life Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Important Events Section */}
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-stone-200/60 dark:border-stone-800/60 shadow-sm transition-colors">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-amber-500" />
                    Important Events
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {format(currentDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewEventDate(todayStr);
                    setIsAddEventModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 transition-colors shadow-2xs"
                  title="Schedule event"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Add Event</span>
                </button>
              </div>

              {events.length > 0 ? (
                <ul className="space-y-4">
                  <AnimatePresence>
                    {events.map((event) => {
                      const isEventToday = (event.date ? event.date === realTodayStr : todayStr === realTodayStr);
                      const typeConfig = EVENT_TYPES.find(t => t.type === event.type) || EVENT_TYPES[EVENT_TYPES.length - 1];
                      const isMilestone = event.id.startsWith('birthday-') || event.id.startsWith('milestone-') || event.id.startsWith('newyear-');

                      return (
                        <motion.li
                          key={event.id}
                          initial={{ opacity: 0, y: 14, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.94, y: -8 }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                          className={cn(
                            "relative rounded-2xl p-4 sm:p-5 transition-all duration-300 border overflow-hidden",
                            isEventToday
                              ? "animate-glow-pulse border-amber-400/90 dark:border-amber-400/80 bg-gradient-to-br from-amber-50/95 via-orange-50/60 to-amber-100/40 dark:from-amber-950/40 dark:via-stone-900/90 dark:to-stone-950 shadow-[0_0_25px_rgba(245,158,11,0.35)]"
                              : "bg-white dark:bg-stone-950/60 border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 shadow-xs"
                          )}
                        >
                          {/* Top Row: Category, Today Indicator, Title & Delete */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border", typeConfig.badgeClass)}>
                                  <span>{typeConfig.icon}</span>
                                  <span>{typeConfig.label}</span>
                                </span>

                                {isEventToday && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-xs animate-pulse">
                                    <Sparkles className="w-3 h-3" />
                                    Today
                                  </span>
                                )}
                              </div>

                              <h4 className="font-serif text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100 break-words">
                                {event.title}
                              </h4>
                            </div>

                            {!isMilestone && (
                              <button
                                onClick={() => removeEvent(todayStr, event.id)}
                                className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors shrink-0"
                                title="Delete event"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Date and Time Chips */}
                          {(event.time || event.date) && (
                            <div className="flex items-center gap-2 flex-wrap mt-2.5 text-xs font-mono text-stone-600 dark:text-stone-400">
                              {event.time && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/60 dark:border-stone-700/60 font-medium">
                                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                                  {formatTimeDisplay(event.time)}
                                </span>
                              )}
                              {event.date && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/60 dark:border-stone-700/60">
                                  <CalendarIcon className="w-3.5 h-3.5 text-stone-400" />
                                  {format(parseISO(event.date), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Note */}
                          {event.note && (
                            <div className="mt-3.5 p-3 sm:p-3.5 rounded-xl bg-stone-50/90 dark:bg-black/40 border border-stone-200/70 dark:border-stone-800/70">
                              <p className="text-xs sm:text-sm font-serif text-stone-700 dark:text-stone-300 leading-relaxed italic whitespace-pre-wrap">
                                "{event.note}"
                              </p>
                              <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                                <span>Note</span>
                                <span>{countWords(event.note)} / 60 words</span>
                              </div>
                            </div>
                          )}
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              ) : (
                /* Purposeful, elegant empty state when no events exist for this day */
                <div className="py-10 px-4 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/30">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 border border-amber-200/60 dark:border-amber-900/60 shadow-2xs">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-serif font-medium text-stone-800 dark:text-stone-200 mb-1">
                    No events scheduled for {format(currentDate, 'MMMM d')}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto mb-4 leading-relaxed">
                    Track birthdays, life milestones, exam dates, deadlines, or personal goals for this day.
                  </p>
                  <button
                    onClick={() => {
                      setNewEventDate(todayStr);
                      setIsAddEventModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Event for Today</span>
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Life Progress & Day's Remark Card */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-stone-200/60 dark:border-stone-800/60 shadow-sm text-center">
              <h3 className="text-xl font-serif mb-1 text-stone-900 dark:text-stone-100">Life Progress</h3>
              <div className="text-4xl py-4">🌍🚀✨</div>
              <p className="text-xl font-medium text-stone-800 dark:text-stone-200 mb-2">
                Level {ageDuration.years || 0} Passed
              </p>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                You've successfully orbited the sun {ageDuration.years || 0} times and survived {totalDaysLived.toLocaleString()} days of utter chaos on this planet. Keep going!
              </p>
            </section>

            {/* Quick Remark Status Card */}
            <section className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-3xl p-6 border border-stone-200/60 dark:border-stone-800/60 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Day's Remark
                </span>
                <button
                  onClick={() => {
                    setActiveTab('remark');
                    setWritingMode(false);
                  }}
                  className="text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1"
                >
                  <span>Open Remark</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {appState.remarks?.[todayStr] === 'yes' ? (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/70">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                    YES
                  </div>
                  <div>
                    <h5 className="text-sm font-serif font-bold text-emerald-900 dark:text-emerald-200">
                      The day was yours! 🔥
                    </h5>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                      Recorded as YES. Click to view or adjust.
                    </p>
                  </div>
                </div>
              ) : appState.remarks?.[todayStr] === 'no' ? (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/70">
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                    NO
                  </div>
                  <div>
                    <h5 className="text-sm font-serif font-bold text-rose-900 dark:text-rose-200">
                      Not quite your day 🥲
                    </h5>
                    <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
                      Recorded as NO. Click to view or journal.
                    </p>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => {
                    setActiveTab('remark');
                    setWritingMode(false);
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-dashed border-stone-200 dark:border-stone-800 cursor-pointer hover:border-amber-400 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-serif text-sm flex items-center justify-center shrink-0">
                    ?
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      Remark not answered yet
                    </h5>
                    <p className="text-[11px] text-stone-500">
                      "{appState.remarkQuestion || 'Was the day yours?'}"
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-stone-900 dark:text-stone-100 pb-24 relative bg-white/20 dark:bg-black/30 transition-colors duration-700">
      <CelestialBackground 
        currentDate={currentDate} 
        isModalOpen={isCelestialModalOpen}
        setIsModalOpen={setIsCelestialModalOpen}
        onSkyStateChange={setCurrentSkyState}
      />
      {renderCalendarModal()}
      {renderNewEntryPromptModal()}
      {renderAddEventModal()}
      {renderDobModal()}
      {renderRemarkSettingsModal()}

      {/* Header Navigation */}
      <header className="sticky top-0 z-10 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevDay}
              disabled={isSameDay(currentDate, dobDate)}
              className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleToday}
              className="px-4 py-1.5 text-sm font-medium rounded-full bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
            >
              Today
            </button>
            <button 
              onClick={handleNextDay}
              className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setIsCelestialModalOpen(true)}
              className="px-2.5 py-1.5 rounded-full bg-stone-200/80 dark:bg-stone-800/80 hover:bg-stone-300 dark:hover:bg-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="View Real-Time Sky & Moon Simulation"
            >
              <span>{currentSkyState?.isDaytime ? '☀️' : '🌙'}</span>
              <span className="hidden sm:inline font-mono text-[11px]">{currentSkyState?.periodLabel || 'Sky'}</span>
            </button>
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors flex items-center justify-center"
              title="Calendar View"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors flex items-center justify-center w-9 h-9 relative overflow-hidden"
              title={`Theme: ${appState.theme}`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={appState.theme}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute"
                >
                  {appState.theme === 'light' ? <Sun className="w-5 h-5" /> : 
                   appState.theme === 'dark' ? <Moon className="w-5 h-5" /> : 
                   <Monitor className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-8 overflow-hidden">
        {/* Core Date Header */}
        <section className="text-center space-y-4 mb-8">
          <h2 className="text-xl md:text-2xl font-medium text-stone-500 dark:text-stone-400 uppercase tracking-widest">
            {format(currentDate, 'EEEE')}
          </h2>
          <h1 className="text-4xl md:text-6xl font-serif tracking-tight">
            {format(currentDate, 'dd/MM/yyyy')}
          </h1>
          <p className="text-lg md:text-xl font-serif italic text-stone-600 dark:text-stone-300 pt-4">
            {format(currentDate, 'MMMM d, yyyy')} — Day {totalDaysLived.toLocaleString()} of your life.
          </p>
        </section>

        <AnimatePresence mode="wait">
          {writingMode ? (
            <motion.div 
              key="writing" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }} 
              transition={{ duration: 0.3 }}
            >
              {renderWritingPage()}
            </motion.div>
          ) : activeTab === 'remark' ? (
            <motion.div 
              key="remark" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }} 
              transition={{ duration: 0.3 }}
            >
              {renderRemarkFlow()}
            </motion.div>
          ) : activeTab === 'note' ? (
            <motion.div 
              key="note" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }} 
              transition={{ duration: 0.3 }}
            >
              {renderNoteList()}
            </motion.div>
          ) : (
            <motion.div 
              key="home" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }} 
              transition={{ duration: 0.3 }}
            >
              {renderHome()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center px-4 py-3">
          <button 
            onClick={() => { setActiveTab('remark'); setWritingMode(false); }} 
            className={cn("flex flex-col items-center gap-1 transition-colors w-20 relative", activeTab === 'remark' ? "text-stone-900 dark:text-stone-100" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300")}
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              {appState.remarks?.[todayStr] === 'yes' && (
                <span className="absolute -top-1 -right-2 text-[8px] font-bold px-1 rounded-full bg-emerald-500 text-white">YES</span>
              )}
              {appState.remarks?.[todayStr] === 'no' && (
                <span className="absolute -top-1 -right-2 text-[8px] font-bold px-1 rounded-full bg-rose-500 text-white">NO</span>
              )}
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider">Remark</span>
          </button>
          <button 
            onClick={() => { setActiveTab('home'); setWritingMode(false); }} 
            className={cn("flex flex-col items-center gap-1 transition-colors w-20", activeTab === 'home' ? "text-stone-900 dark:text-stone-100" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300")}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-semibold uppercase tracking-wider">Home</span>
          </button>
          <button 
            onClick={() => { setActiveTab('note'); setWritingMode(false); }} 
            className={cn("flex flex-col items-center gap-1 transition-colors w-20", activeTab === 'note' ? "text-stone-900 dark:text-stone-100" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300")}
          >
            <FileText className="w-6 h-6" />
            <span className="text-xs font-semibold uppercase tracking-wider">Note</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function StatCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col justify-center">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
        {title}
      </h4>
      <div className="text-stone-900 dark:text-stone-100">
        {children}
      </div>
    </div>
  );
}
