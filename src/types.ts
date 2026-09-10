export type EventType = 'Birthday' | 'Exam' | 'Goal' | 'Anniversary' | 'Deadline' | 'Milestone' | 'Other';

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date?: string;
  time?: string;
  note?: string;
}

export type DayRating = 'pass' | 'fail' | null;

export interface NoteEntry {
  title: string;
  content: string;
}

export interface AppState {
  dob: string | null;
  lifeExpectancy: number;
  theme: 'light' | 'dark' | 'system';
  notes: Record<string, NoteEntry | string>;
  events: Record<string, CalendarEvent[]>;
  dayRatings: Record<string, DayRating>;
  remarks: Record<string, 'yes' | 'no' | null>;
  remarkQuestion?: string;
}
