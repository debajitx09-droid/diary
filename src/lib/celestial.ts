/**
 * Astronomical and time-of-day calculation utilities
 * Provides exact real-time Moon phase (synodic cycle ~29.53 days, 15-day waxing/waning fortnights),
 * sun position, and dynamic sky state.
 */

export interface MoonPhaseInfo {
  phase: number; // 0.0 to 1.0 (0=New, 0.25=First Quarter, 0.5=Full, 0.75=Last Quarter)
  fraction: number; // 0.0 to 1.0 (fraction of moon disk illuminated)
  phaseName: string;
  isWaxing: boolean;
  fortnightDay: number; // 1 to 15 (The 15-day cycle from New to Full, or Full to New)
  fortnightName: string; // "Waxing (Shukla Paksha)" or "Waning (Krishna Paksha)"
  daysIntoCycle: number; // 0 to 29.5
  description: string;
}

export type SkyTimePeriod = 'night' | 'dawn' | 'morning' | 'afternoon' | 'sunset';
export type Season = 'winter' | 'summer';

export interface SkyState {
  period: SkyTimePeriod;
  periodLabel: string;
  isDaytime: boolean;
  sunAltitude: number; // 0 to 1 (normalized height above horizon)
  moonAltitude: number; // 0 to 1
  skyGradient: string;
  gradientCss: string;
  moonInfo: MoonPhaseInfo;
  season: Season;
  nightStartTime: string;
}

// Reference New Moon: Jan 11, 2024 at 11:57:00 UTC
const REF_NEW_MOON_MS = 1704974220000;
const SYNODIC_MONTH_MS = 29.53058867 * 24 * 60 * 60 * 1000; // ~29.53059 days

export function getSeason(date: Date = new Date()): Season {
  const month = date.getMonth(); // 0 = Jan, 1 = Feb, ..., 11 = Dec
  // Summer: April (3) through September (8)
  // Winter: October (9) through March (2)
  if (month >= 3 && month <= 8) {
    return 'summer';
  }
  return 'winter';
}

export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const diffMs = date.getTime() - REF_NEW_MOON_MS;
  let phase = (diffMs % SYNODIC_MONTH_MS) / SYNODIC_MONTH_MS;
  if (phase < 0) phase += 1;

  const daysIntoCycle = phase * 29.53058867;
  // Illumination fraction formula: (1 - cos(2 * pi * phase)) / 2
  const fraction = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const isWaxing = phase <= 0.5;

  // 15-day cycle calculation (1 to 15 in each half of the cycle)
  let fortnightDay: number;
  let fortnightName: string;

  if (isWaxing) {
    // New moon to Full moon: 15 day progression
    fortnightDay = Math.min(15, Math.max(1, Math.round(phase * 2 * 14) + 1));
    fortnightName = "Waxing Cycle (15-day)";
  } else {
    // Full moon to New moon: 15 day progression
    fortnightDay = Math.min(15, Math.max(1, Math.round((phase - 0.5) * 2 * 14) + 1));
    fortnightName = "Waning Cycle (15-day)";
  }

  let phaseName = 'New Moon';
  if (phase >= 0.02 && phase < 0.23) {
    phaseName = 'Waxing Crescent';
  } else if (phase >= 0.23 && phase < 0.27) {
    phaseName = 'First Quarter';
  } else if (phase >= 0.27 && phase < 0.48) {
    phaseName = 'Waxing Gibbous';
  } else if (phase >= 0.48 && phase < 0.52) {
    phaseName = 'Full Moon';
  } else if (phase >= 0.52 && phase < 0.73) {
    phaseName = 'Waning Gibbous';
  } else if (phase >= 0.73 && phase < 0.77) {
    phaseName = 'Last Quarter';
  } else if (phase >= 0.77 && phase < 0.98) {
    phaseName = 'Waning Crescent';
  }

  return {
    phase,
    fraction,
    phaseName,
    isWaxing,
    fortnightDay,
    fortnightName,
    daysIntoCycle,
    description: `${phaseName} • Day ${fortnightDay} of 15 (${Math.round(fraction * 100)}% illuminated)`
  };
}

export function getSkyState(
  date: Date = new Date(), 
  overridePeriod?: SkyTimePeriod | 'auto',
  seasonOverride?: Season | 'auto'
): SkyState {
  const moonInfo = getMoonPhase(date);
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

  const season: Season = (seasonOverride && seasonOverride !== 'auto') ? seasonOverride : getSeason(date);
  // Winter: night begins after 6:00 PM (18:00)
  // Summer: night begins after 6:45 PM (18:45 = 18.75)
  const nightStartTime = season === 'winter' ? '6:00 PM' : '6:45 PM';
  const nightStartHour = season === 'winter' ? 18.0 : 18.75;
  const sunsetStartHour = season === 'winter' ? 17.0 : 17.75; // 5:00 PM in winter, 5:45 PM in summer
  const dawnStartHour = season === 'winter' ? 5.5 : 5.0; // 5:30 AM in winter, 5:00 AM in summer
  const morningStartHour = season === 'winter' ? 7.25 : 7.0; // 7:15 AM in winter, 7:00 AM in summer

  let period: SkyTimePeriod;

  if (overridePeriod && overridePeriod !== 'auto') {
    period = overridePeriod;
  } else {
    // Determine period based on local clock and seasonal night schedule:
    // Winter: night starts strictly after 6:00 PM (18:00)
    // Summer: night starts strictly after 6:45 PM (18:45)
    if (hours >= dawnStartHour && hours < morningStartHour) {
      period = 'dawn';
    } else if (hours >= morningStartHour && hours < 12) {
      period = 'morning';
    } else if (hours >= 12 && hours < sunsetStartHour) {
      period = 'afternoon';
    } else if (hours >= sunsetStartHour && hours < nightStartHour) {
      period = 'sunset';
    } else {
      period = 'night';
    }
  }

  let periodLabel = 'Night Sky';
  let isDaytime = false;
  let sunAltitude = 0;
  let moonAltitude = 0.8;
  let skyGradient = '';
  let gradientCss = '';

  switch (period) {
    case 'dawn':
      periodLabel = 'Golden Dawn';
      isDaytime = true;
      sunAltitude = 0.2;
      moonAltitude = 0.3;
      skyGradient = 'from-[#10132b] via-[#793c5c] to-[#f69463]';
      gradientCss = 'linear-gradient(180deg, #10132b 0%, #31234c 28%, #793c5c 54%, #bf5252 75%, #f69463 100%)';
      break;
    case 'morning':
      periodLabel = 'Morning Sky';
      isDaytime = true;
      sunAltitude = 0.65;
      moonAltitude = 0.1;
      skyGradient = 'from-[#1765a8] via-[#72b7f0] to-[#cde7fd]';
      gradientCss = 'linear-gradient(180deg, #1765a8 0%, #388ed9 35%, #72b7f0 70%, #cde7fd 100%)';
      break;
    case 'afternoon':
      periodLabel = 'Bright Afternoon';
      isDaytime = true;
      sunAltitude = 0.9;
      moonAltitude = 0.05;
      skyGradient = 'from-[#135596] via-[#63a9e6] to-[#bde0fb]';
      gradientCss = 'linear-gradient(180deg, #135596 0%, #297cca 35%, #63a9e6 70%, #bde0fb 100%)';
      break;
    case 'sunset':
      periodLabel = `Evening Sunset (Night at ${nightStartTime})`;
      isDaytime = false;
      sunAltitude = 0.15;
      moonAltitude = 0.6;
      skyGradient = 'from-[#16122d] via-[#752648] to-[#ef7a44]';
      gradientCss = 'linear-gradient(180deg, #16122d 0%, #3a1a3e 25%, #752648 50%, #ba3f42 75%, #ef7a44 100%)';
      break;
    case 'night':
    default:
      periodLabel = `${season === 'winter' ? 'Winter' : 'Summer'} Night Sky`;
      isDaytime = false;
      sunAltitude = 0;
      moonAltitude = 0.85;
      skyGradient = 'from-[#020409] via-[#0b1331] to-[#10183b]';
      gradientCss = 'linear-gradient(180deg, #020409 0%, #050a1b 30%, #0b1331 65%, #10183b 100%)';
      break;
  }

  return {
    period,
    periodLabel,
    isDaytime,
    sunAltitude,
    moonAltitude,
    skyGradient,
    gradientCss,
    moonInfo,
    season,
    nightStartTime
  };
}

/**
 * Calculates the exact SVG path for the Moon's illuminated portion
 * given a radius R and phase (0 to 1).
 * Center is (cx, cy).
 */
export function getMoonIlluminationPath(cx: number, cy: number, r: number, phase: number): string {
  // Phase 0.0 to 1.0
  // Normalized: 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
  const theta = 2 * Math.PI * phase;
  const isWaxing = phase <= 0.5;
  
  // Outer limb semi-circle (on the illuminated side)
  // If waxing, bright limb is on the right (dx > 0)
  // If waning, bright limb is on the left (dx < 0)
  const sweepOuter = isWaxing ? 1 : 0;
  
  // Terminator curve: ellipse with x-radius = r * cos(theta)
  // When cos(theta) > 0 (crescent), inner curve is hollowed out (sweep = same)
  // When cos(theta) < 0 (gibbous), inner curve bulges out into the dark side (sweep = opposite)
  const cosTheta = Math.cos(theta);
  const rx = Math.max(0.01, Math.abs(r * cosTheta));
  
  // Sweep flag for returning along terminator from bottom to top
  // For crescent: inner arc curves in the same direction as the outer limb
  // For gibbous: inner arc bulges in the opposite direction
  let sweepInner: number;
  if (isWaxing) {
    sweepInner = cosTheta >= 0 ? 0 : 1;
  } else {
    sweepInner = cosTheta >= 0 ? 1 : 0;
  }

  const top = `${cx},${cy - r}`;
  const bottom = `${cx},${cy + r}`;

  // Start at top pole, arc down outer limb to bottom pole, then arc back along terminator to top
  return `M ${top} A ${r} ${r} 0 0 ${sweepOuter} ${bottom} A ${rx.toFixed(2)} ${r} 0 0 ${sweepInner} ${top} Z`;
}
