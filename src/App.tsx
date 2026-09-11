/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { DailyDashboard } from './components/DailyDashboard';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AppState, DayRating, CalendarEvent, NoteEntry } from './types';

const INITIAL_STATE: AppState = {
  dob: null,
  lifeExpectancy: 80,
  theme: 'system',
  notes: {},
  events: {},
  dayRatings: {},
  remarks: {}
};

export default function App() {
  const [appState, setAppState] = useLocalStorage<AppState>('mylifecalendar_state', INITIAL_STATE);

  // Handle Theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (appState.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(appState.theme);
    }
  }, [appState.theme]);

  const handleSetupComplete = (dob: string) => {
    setAppState(prev => ({ ...prev, dob }));
  };

  const updateDob = (dob: string) => {
    setAppState(prev => ({ ...prev, dob }));
  };

  const updateNote = (date: string, note: NoteEntry) => {
    setAppState(prev => ({
      ...prev,
      notes: { ...(prev.notes || {}), [date]: note }
    }));
  };

  const updateDayRating = (date: string, rating: DayRating) => {
    setAppState(prev => ({
      ...prev,
      dayRatings: { ...(prev.dayRatings || {}), [date]: rating }
    }));
  };

  const updateRemark = (date: string, remark: 'yes' | 'no' | null) => {
    setAppState(prev => ({
      ...prev,
      remarks: { ...(prev.remarks || {}), [date]: remark }
    }));
  };

  const addEvent = (date: string, event: Omit<CalendarEvent, 'id'>) => {
    const newEvent = { ...event, id: Math.random().toString(36).substring(7) };
    setAppState(prev => {
      const existing = (prev.events && prev.events[date]) || [];
      return {
        ...prev,
        events: { ...(prev.events || {}), [date]: [...existing, newEvent] }
      };
    });
  };

  const removeEvent = (date: string, id: string) => {
    setAppState(prev => {
      const existing = (prev.events && prev.events[date]) || [];
      return {
        ...prev,
        events: { ...(prev.events || {}), [date]: existing.filter(e => e.id !== id) }
      };
    });
  };

  const updateLifeExpectancy = (years: number) => {
    setAppState(prev => ({ ...prev, lifeExpectancy: years }));
  };

  const toggleTheme = () => {
    setAppState(prev => {
      const next = prev.theme === 'light' ? 'dark' : prev.theme === 'dark' ? 'system' : 'light';
      return { ...prev, theme: next };
    });
  };

  if (!appState?.dob) {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  const safeAppState: AppState = {
    dob: appState.dob,
    lifeExpectancy: appState.lifeExpectancy || 80,
    theme: appState.theme || 'system',
    notes: appState.notes || {},
    events: appState.events || {},
    dayRatings: appState.dayRatings || {},
    remarks: appState.remarks || {},
    remarkQuestion: appState.remarkQuestion || 'Was the day yours?'
  };

  return (
    <DailyDashboard 
      appState={safeAppState}
      setAppState={setAppState}
      updateDob={updateDob}
      updateNote={updateNote}
      updateDayRating={updateDayRating}
      updateRemark={updateRemark}
      addEvent={addEvent}
      removeEvent={removeEvent}
      updateLifeExpectancy={updateLifeExpectancy}
      toggleTheme={toggleTheme}
    />
  );
}
