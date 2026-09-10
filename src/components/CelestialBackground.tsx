import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, 
  Sun, 
  Sparkles, 
  CloudSun, 
  Sunset, 
  Clock, 
  Info, 
  Check, 
  X,
  ChevronDown
} from 'lucide-react';
import { 
  getSkyState, 
  getMoonIlluminationPath, 
  SkyState, 
  SkyTimePeriod,
  Season 
} from '../lib/celestial';
import { cn } from '../lib/utils';

// Deterministic star generator for consistent starry night
interface Star {
  id: number;
  x: number; // 0 to 100%
  y: number; // 0 to 80% (sky region)
  size: number; // 1 to 3px
  duration: number; // 2 to 5s
  delay: number; // 0 to 5s
  color: string;
}

function generateStars(count = 70): Star[] {
  const stars: Star[] = [];
  // Use a pseudo-random LCG so stars are consistently positioned
  let seed = 42;
  const lcg = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const starColors = [
    '#ffffff',
    '#ffffff',
    '#e2f1ff',
    '#fff7db',
    '#bfe4ff',
    '#ffe9c2'
  ];

  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: lcg() * 100,
      y: lcg() * 85,
      size: 1 + lcg() * 2.2,
      duration: 2 + lcg() * 3.5,
      delay: lcg() * 4,
      color: starColors[Math.floor(lcg() * starColors.length)]
    });
  }
  return stars;
}

interface CelestialBackgroundProps {
  currentDate?: Date;
  onSkyStateChange?: (state: SkyState) => void;
  isModalOpen?: boolean;
  setIsModalOpen?: (open: boolean) => void;
}

export function CelestialBackground({ 
  currentDate, 
  onSkyStateChange,
  isModalOpen: controlledModalOpen,
  setIsModalOpen: setControlledModalOpen
}: CelestialBackgroundProps) {
  const [now, setNow] = useState<Date>(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<SkyTimePeriod | 'auto'>('auto');
  const [selectedSeason, setSelectedSeason] = useState<Season | 'auto'>('auto');
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const isModalOpen = controlledModalOpen !== undefined ? controlledModalOpen : internalModalOpen;
  const setIsModalOpen = setControlledModalOpen || setInternalModalOpen;

  // Keep internal time synced every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const skyState = useMemo(() => {
    // If a specific date is viewed in the calendar, we can factor the moon phase for that date!
    const targetDate = currentDate || now;
    // Combine calendar date with current real time of day
    const combinedDate = new Date(targetDate);
    combinedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    
    return getSkyState(combinedDate, selectedPeriod, selectedSeason);
  }, [currentDate, now, selectedPeriod, selectedSeason]);

  useEffect(() => {
    if (onSkyStateChange) {
      onSkyStateChange(skyState);
    }
  }, [skyState, onSkyStateChange]);

  const stars = useMemo(() => generateStars(75), []);

  const moonIlluminationPath = useMemo(() => {
    // Center at 50, 50, radius 46 in 100x100 SVG
    return getMoonIlluminationPath(50, 50, 46, skyState.moonInfo.phase);
  }, [skyState.moonInfo.phase]);

  // Is daytime or night
  const isNight = skyState.period === 'night';
  const isDawn = skyState.period === 'dawn';
  const isSunset = skyState.period === 'sunset';
  const isDay = skyState.period === 'morning' || skyState.period === 'afternoon';
  const showStars = isNight || isDawn || isSunset;
  const showMoon = isNight || isDawn || isSunset || skyState.moonInfo.fraction > 0.4;
  const showSun = isDay || isDawn || isSunset;

  return (
    <>
      {/* Background Atmosphere Container */}
      <div 
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-all duration-1000"
        style={{ background: skyState.gradientCss || 'linear-gradient(180deg, #020409 0%, #050a1b 30%, #0b1331 65%, #10183b 100%)' }}
      >
        {/* Soft atmospheric radial gradient */}
        <div 
          className="absolute inset-0 opacity-45 mix-blend-screen transition-opacity duration-1000"
          style={{
            background: isDay 
              ? 'radial-gradient(ellipse at 75% 20%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 230, 160, 0.15) 45%, transparent 75%)'
              : isSunset
              ? 'radial-gradient(ellipse at 25% 65%, rgba(255, 120, 60, 0.5) 0%, rgba(180, 40, 90, 0.2) 50%, transparent 80%)'
              : isDawn
              ? 'radial-gradient(ellipse at 75% 65%, rgba(255, 150, 80, 0.45) 0%, rgba(120, 60, 110, 0.2) 50%, transparent 80%)'
              : 'radial-gradient(ellipse at 75% 25%, rgba(120, 160, 255, 0.22) 0%, rgba(60, 30, 120, 0.12) 45%, transparent 75%)'
          }}
        />

        {/* ================= STARS & METEORS ================= */}
        <AnimatePresence>
          {showStars && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: isNight ? 1 : isSunset || isDawn ? 0.45 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              {/* Twinkling Star field */}
              {stars.map((star) => (
                <div
                  key={star.id}
                  className="absolute rounded-full animate-twinkle pointer-events-none"
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    backgroundColor: star.color,
                    boxShadow: star.size > 2 ? `0 0 ${star.size * 2}px ${star.color}` : 'none',
                    // CSS variables for keyframe animation
                    ['--twinkle-duration' as any]: `${star.duration}s`,
                    ['--twinkle-delay' as any]: `${star.delay}s`
                  }}
                />
              ))}

              {/* Occasional Shooting Stars (Meteors) */}
              {isNight && (
                <>
                  <div 
                    className="absolute top-[14%] right-[25%] w-32 h-[1.5px] bg-gradient-to-r from-transparent via-white to-sky-200 animate-shooting-star origin-right"
                    style={{ ['--star-duration' as any]: '9s', ['--star-delay' as any]: '1.5s' }}
                  />
                  <div 
                    className="absolute top-[26%] right-[55%] w-44 h-[1.5px] bg-gradient-to-r from-transparent via-white to-amber-100 animate-shooting-star origin-right"
                    style={{ ['--star-duration' as any]: '14s', ['--star-delay' as any]: '6s' }}
                  />
                  <div 
                    className="absolute top-[10%] right-[70%] w-28 h-[1px] bg-gradient-to-r from-transparent via-sky-100 to-white animate-shooting-star origin-right"
                    style={{ ['--star-duration' as any]: '11s', ['--star-delay' as any]: '10s' }}
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= REAL-TIME MOON ================= */}
        <AnimatePresence>
          {showMoon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ 
                opacity: isNight ? 1 : isSunset || isDawn ? 0.85 : 0.45,
                scale: 1, 
                y: 0 
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 1.2 }}
              className={cn(
                "absolute select-none cursor-pointer pointer-events-auto group transition-all duration-1000",
                // Clear of header bar (header is 64px)
                isNight
                  ? "top-20 right-6 md:top-24 md:right-16"
                  : isDawn
                  ? "top-20 left-6 md:top-24 md:left-14"
                  : isSunset
                  ? "top-20 right-6 md:top-24 md:right-16"
                  : "top-24 left-6 md:top-28 md:left-16"
              )}
              onClick={() => setIsModalOpen(true)}
              title={`${skyState.moonInfo.phaseName} (Day ${skyState.moonInfo.fortnightDay} of 15) - Click for details`}
            >
              <div className="relative w-24 h-24 md:w-32 md:h-32">
                {/* Atmospheric Lunar Glow Halo */}
                <div 
                  className={cn(
                    "absolute -inset-4 md:-inset-6 rounded-full blur-xl transition-all duration-1000",
                    isNight 
                      ? "bg-slate-200/20 group-hover:bg-slate-100/30" 
                      : "bg-amber-100/10"
                  )}
                />

                {/* Secondary outer radial haze */}
                <div 
                  className="absolute -inset-10 rounded-full blur-3xl opacity-30"
                  style={{
                    background: 'radial-gradient(circle, rgba(190, 215, 255, 0.25) 0%, transparent 70%)'
                  }}
                />

                {/* Detailed SVG Moon Sphere */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                >
                  <defs>
                    {/* Dark side gradient (Earthshine) */}
                    <radialGradient id="darkSideGrad" cx="40%" cy="40%" r="65%">
                      <stop offset="0%" stopColor="#252a38" />
                      <stop offset="70%" stopColor="#151924" />
                      <stop offset="100%" stopColor="#0b0e17" />
                    </radialGradient>

                    {/* Illuminated side gradient (Pearlescent Moonlight) */}
                    <radialGradient id="illuminatedGrad" cx="45%" cy="40%" r="60%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#eef4fb" />
                      <stop offset="85%" stopColor="#d2deed" />
                      <stop offset="100%" stopColor="#b4c5dc" />
                    </radialGradient>

                    {/* Lunar Maria (Dark basaltic plains) texture pattern */}
                    <filter id="lunarTexture" x="0" y="0" width="100%" height="100%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
                      <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0.2 0" />
                    </filter>

                    {/* Clip path for the exact illuminated phase shape */}
                    <clipPath id="moonPhaseClip">
                      <path d={moonIlluminationPath} />
                    </clipPath>

                    {/* Outer moon boundary circle */}
                    <clipPath id="moonCircle">
                      <circle cx="50" cy="50" r="46" />
                    </clipPath>
                  </defs>

                  {/* 1. Base Disk (The entire moon sphere including dark side / Earthshine) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="url(#darkSideGrad)"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="0.8"
                  />

                  {/* 2. Earthshine Maria (faintly visible basaltic seas on dark side) */}
                  <g clipPath="url(#moonCircle)" opacity="0.45">
                    {/* Oceanus Procellarum */}
                    <ellipse cx="36" cy="42" rx="14" ry="18" fill="#121620" />
                    {/* Mare Imbrium */}
                    <circle cx="42" cy="30" r="10" fill="#10141e" />
                    {/* Mare Serenitatis & Tranquillitatis */}
                    <circle cx="60" cy="38" r="8" fill="#111520" />
                    <circle cx="64" cy="48" r="9" fill="#121722" />
                    {/* Mare Crisium */}
                    <ellipse cx="76" cy="40" rx="5" ry="6" fill="#0f131c" />
                    {/* Tycho crater splash */}
                    <circle cx="52" cy="74" r="3.5" fill="#1c2230" />
                  </g>

                  {/* 3. Illuminated Region (Precisely masked by astronomical phase path) */}
                  <g clipPath="url(#moonPhaseClip)">
                    {/* Bright regolith surface */}
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="url(#illuminatedGrad)"
                    />

                    {/* Maria texture on the bright side */}
                    <g opacity="0.32">
                      <ellipse cx="36" cy="42" rx="14" ry="18" fill="#7a8ca3" />
                      <circle cx="42" cy="30" r="10" fill="#6f8199" />
                      <circle cx="60" cy="38" r="8" fill="#76889e" />
                      <circle cx="64" cy="48" r="9" fill="#72849c" />
                      <ellipse cx="76" cy="40" rx="5" ry="6" fill="#687990" />
                      {/* Tycho rays */}
                      <circle cx="52" cy="74" r="3" fill="#ffffff" />
                      <path d="M 52,74 L 38,55 M 52,74 L 68,58 M 52,74 L 54,88" stroke="#ffffff" strokeWidth="0.75" opacity="0.6" />
                    </g>

                    {/* Limb highlight */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45.5"
                      fill="none"
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth="1"
                      opacity="0.8"
                    />
                  </g>

                  {/* 4. 3D Spherical Rim & terminator shadow softness */}
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1.2"
                  />
                </svg>

                {/* Interactive Tooltip Badge (visible on hover or tap) */}
                <div className={cn(
                  "absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md transition-all duration-300 pointer-events-none shadow-md",
                  isTooltipVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100",
                  "bg-stone-900/80 text-stone-100 border border-stone-700/50"
                )}>
                  {skyState.moonInfo.phaseName} • Day {skyState.moonInfo.fortnightDay}/15
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= SUN & MORNING / DAYLIGHT ================= */}
        <AnimatePresence>
          {showSun && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ 
                opacity: isDay ? 1 : isDawn || isSunset ? 0.95 : 0, 
                scale: 1, 
                y: 0 
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 1.5 }}
              className={cn(
                "absolute pointer-events-none select-none transition-all duration-1000",
                // Position high in sky clear of header
                isDawn 
                  ? "top-28 right-8 md:top-32 md:right-20"
                  : isSunset
                  ? "top-28 left-8 md:top-32 md:left-20"
                  : "top-20 right-8 md:top-24 md:right-20"
              )}
            >
              <div className="relative w-28 h-28 md:w-36 md:h-36">
                {/* Expansive Ambient Sun Glare */}
                <div 
                  className={cn(
                    "absolute -inset-16 md:-inset-24 rounded-full blur-3xl opacity-75 animate-sun-pulse",
                    isSunset || isDawn 
                      ? "bg-gradient-to-r from-orange-400 via-rose-500 to-amber-300" 
                      : "bg-gradient-to-r from-amber-200 via-yellow-300 to-sky-100"
                  )}
                />

                {/* Rotating Corona Sunrays */}
                <svg
                  viewBox="0 0 100 100"
                  className="absolute inset-0 w-full h-full animate-sun-rays opacity-50"
                >
                  <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255, 235, 150, 0.4)" strokeWidth="1" strokeDasharray="3 4" />
                  <line x1="50" y1="6" x2="50" y2="18" stroke="rgba(255, 220, 100, 0.7)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="50" y1="82" x2="50" y2="94" stroke="rgba(255, 220, 100, 0.7)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="6" y1="50" x2="18" y2="50" stroke="rgba(255, 220, 100, 0.7)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="82" y1="50" x2="94" y2="50" stroke="rgba(255, 220, 100, 0.7)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="19" y1="19" x2="28" y2="28" stroke="rgba(255, 220, 100, 0.6)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="72" y1="72" x2="81" y2="81" stroke="rgba(255, 220, 100, 0.6)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="81" y1="19" x2="72" y2="28" stroke="rgba(255, 220, 100, 0.6)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="28" y1="72" x2="19" y2="81" stroke="rgba(255, 220, 100, 0.6)" strokeWidth="2" strokeLinecap="round" />
                </svg>

                {/* Core Radiant Sun Orb */}
                <div 
                  className={cn(
                    "absolute inset-5 rounded-full shadow-2xl transition-all duration-1000",
                    isSunset || isDawn
                      ? "bg-gradient-to-tr from-rose-500 via-orange-400 to-amber-200 shadow-orange-500/50"
                      : "bg-gradient-to-tr from-amber-400 via-yellow-200 to-white shadow-yellow-300/60"
                  )}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= DRIFTING CLOUDS (Daytime / Sunset) ================= */}
        <AnimatePresence>
          {(isDay || isDawn || isSunset) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 pointer-events-none overflow-hidden"
            >
              {/* Cloud 1 - Slow high-altitude fluff */}
              <div 
                className="absolute top-[8%] -left-36 w-80 h-24 rounded-full opacity-40 blur-md animate-drift-slow"
                style={{
                  background: isSunset 
                    ? 'linear-gradient(to bottom, rgba(255, 180, 160, 0.7), rgba(220, 120, 140, 0.3))' 
                    : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(240, 248, 255, 0.3))'
                }}
              />

              {/* Cloud 2 - Mid-range billowing cloud */}
              <div 
                className="absolute top-[18%] -left-48 w-96 h-28 rounded-full opacity-35 blur-lg animate-drift-mid"
                style={{
                  animationDelay: '-25s',
                  background: isSunset 
                    ? 'linear-gradient(to bottom, rgba(255, 210, 180, 0.6), rgba(180, 90, 130, 0.2))' 
                    : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.75), rgba(220, 240, 255, 0.2))'
                }}
              />

              {/* Cloud 3 - Lower gentle cloud */}
              <div 
                className="absolute top-[32%] -left-64 w-[30rem] h-32 rounded-full opacity-25 blur-xl animate-drift-fast"
                style={{
                  animationDelay: '-12s',
                  background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.7), rgba(200, 230, 255, 0.1))'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Celestial Info & Sky Mode Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl w-full max-w-md border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="font-serif text-lg font-medium">Real-Time Celestial Sky</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Detailed Real-Time Moon Breakdown */}
              <div className="py-4 space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800">
                  <div className="w-14 h-14 shrink-0 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-700 shadow-inner">
                    <svg viewBox="0 0 100 100" className="w-12 h-12">
                      <circle cx="50" cy="50" r="46" fill="#151924" />
                      <path d={moonIlluminationPath} fill="#eef4fb" />
                      <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-serif text-base font-semibold">
                      {skyState.moonInfo.phaseName}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {skyState.moonInfo.fortnightName}
                    </p>
                    <p className="text-xs text-stone-700 dark:text-stone-300 font-mono mt-1">
                      Day {skyState.moonInfo.fortnightDay} of 15 • {Math.round(skyState.moonInfo.fraction * 100)}% illuminated
                    </p>
                  </div>
                </div>

                {/* 15-Day Fortnight Progress Bar */}
                <div className="space-y-1.5 px-1">
                  <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 font-medium">
                    <span>{skyState.moonInfo.isWaxing ? '🌑 New Moon (Day 1)' : '🌕 Full Moon (Day 1)'}</span>
                    <span>{skyState.moonInfo.isWaxing ? '🌕 Full Moon (Day 15)' : '🌑 New Moon (Day 15)'}</span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${(skyState.moonInfo.fortnightDay / 15) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 text-center italic">
                    Traditional 15-day astronomical lunar fortnight cycle
                  </p>
                </div>

                {/* Seasonal Night Start Schedule */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                      Seasonal Night Schedule
                    </label>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                      Night starts at {skyState.nightStartTime}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      onClick={() => setSelectedSeason('auto')}
                      className={cn(
                        "p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-center",
                        selectedSeason === 'auto'
                          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-transparent font-semibold shadow-sm"
                          : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:bg-stone-100"
                      )}
                    >
                      <span className="font-medium">Auto (Calendar)</span>
                      <span className="text-[10px] opacity-75">{skyState.season === 'summer' ? 'Summer active' : 'Winter active'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedSeason('winter')}
                      className={cn(
                        "p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-center",
                        selectedSeason === 'winter'
                          ? "bg-sky-600 text-white border-transparent font-semibold shadow-sm"
                          : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:bg-stone-100"
                      )}
                    >
                      <span className="font-medium">❄️ Winter</span>
                      <span className="text-[10px] opacity-90">Night at 6:00 PM</span>
                    </button>

                    <button
                      onClick={() => setSelectedSeason('summer')}
                      className={cn(
                        "p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-center",
                        selectedSeason === 'summer'
                          ? "bg-amber-600 text-white border-transparent font-semibold shadow-sm"
                          : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:bg-stone-100"
                      )}
                    >
                      <span className="font-medium">☀️ Summer</span>
                      <span className="text-[10px] opacity-90">Night at 6:45 PM</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                    Astronomical night initiates strictly after <strong className="text-stone-700 dark:text-stone-300">6:00 PM</strong> in winter and after <strong className="text-stone-700 dark:text-stone-300">6:45 PM</strong> in summer, dynamically transitioning the background into twilight and starry night.
                  </p>
                </div>

                {/* Sky Atmosphere Mode / Preview Selector */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Atmosphere Simulation
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      onClick={() => setSelectedPeriod('auto')}
                      className={cn(
                        "p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all col-span-3",
                        selectedPeriod === 'auto'
                          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-transparent font-semibold shadow-sm"
                          : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:bg-stone-100"
                      )}
                    >
                      <Clock className="w-4 h-4" />
                      <span>Live Real-Time Clock ({skyState.periodLabel})</span>
                    </button>

                    <button
                      onClick={() => setSelectedPeriod('morning')}
                      className={cn(
                        "p-2 rounded-xl border flex flex-col items-center gap-1 transition-all",
                        selectedPeriod === 'morning'
                          ? "bg-sky-500 text-white border-transparent font-semibold shadow-sm"
                          : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:bg-stone-100"
                      )}
                    >
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Morning</span>
                    </button>

                    <button
                      onClick={() => setSelectedPeriod('afternoon')}
                      className={cn(
                        "p-2 rounded-xl border flex flex-col items-center gap-1 transition-all",
                        selectedPeriod === 'afternoon'
                          ? "bg-sky-600 text-white border-transparent font-semibold shadow-sm"
                          : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:bg-stone-100"
                      )}
                    >
                      <CloudSun className="w-4 h-4 text-amber-300" />
                      <span>Afternoon</span>
                    </button>

                    <button
                      onClick={() => setSelectedPeriod('sunset')}
                      className={cn(
                        "p-2 rounded-xl border flex flex-col items-center gap-1 transition-all",
                        selectedPeriod === 'sunset'
                          ? "bg-orange-500 text-white border-transparent font-semibold shadow-sm"
                          : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:bg-stone-100"
                      )}
                    >
                      <Sunset className="w-4 h-4 text-rose-300" />
                      <span>Sunset</span>
                    </button>

                    <button
                      onClick={() => setSelectedPeriod('night')}
                      className={cn(
                        "p-2 rounded-xl border flex flex-col items-center gap-1 transition-all col-span-3",
                        selectedPeriod === 'night'
                          ? "bg-indigo-950 text-sky-200 border-indigo-700 font-semibold shadow-sm"
                          : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:bg-stone-100"
                      )}
                    >
                      <Moon className="w-4 h-4 text-sky-300" />
                      <span>Starry Night with Real Moon Phase</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-sm font-medium rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
