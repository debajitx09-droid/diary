import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { CelestialBackground } from './CelestialBackground';

interface SetupScreenProps {
  onComplete: (dob: string) => void;
}

export function SetupScreen({ onComplete }: SetupScreenProps) {
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob) {
      setError('Please select a date');
      return;
    }
    
    const selectedDate = new Date(dob);
    if (selectedDate > new Date()) {
      setError('Date of birth cannot be in the future');
      return;
    }

    onComplete(dob);
  };

  return (
    <div className="min-h-screen text-stone-900 dark:text-stone-50 flex flex-col items-center justify-center p-4 relative bg-stone-50/60 dark:bg-stone-950/65 backdrop-blur-[1.5px] transition-colors duration-1000">
      <CelestialBackground />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full space-y-12 text-center relative z-10"
      >
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md rounded-full mb-4 border border-stone-200/50 dark:border-stone-800/50 shadow-sm">
            <CalendarDays className="w-8 h-8 text-stone-700 dark:text-stone-300" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif tracking-tight drop-shadow-sm">
            My Life Calendar
          </h1>
          <p className="text-stone-600 dark:text-stone-300 text-lg italic font-serif">
            "Your life is made of days. Make each one count."
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white/85 dark:bg-stone-900/85 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-stone-200/60 dark:border-stone-800/60">
          <div className="space-y-4 text-left">
            <label htmlFor="dob" className="block text-sm font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Enter your date of birth
            </label>
            <input
              type="date"
              id="dob"
              value={dob}
              onChange={(e) => {
                setDob(e.target.value);
                setError('');
              }}
              className={cn(
                "w-full p-4 rounded-xl border bg-stone-50/80 dark:bg-stone-950/80 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 focus:border-transparent",
                error ? "border-red-300 dark:border-red-900" : "border-stone-200 dark:border-stone-800"
              )}
            />
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-4 px-6 rounded-xl font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-md cursor-pointer"
          >
            Start My Calendar
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
            <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-stone-400">or</span>
            <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
          </div>

          <button
            type="button"
            onClick={() => onComplete('2000-01-01')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Explore with Demo Profile (Born Jan 1, 2000)
          </button>
        </form>
      </motion.div>
    </div>
  );
}

