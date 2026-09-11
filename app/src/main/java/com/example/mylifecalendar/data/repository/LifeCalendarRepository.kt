package com.example.mylifecalendar.data.repository

import com.example.mylifecalendar.data.db.AppDatabase
import com.example.mylifecalendar.data.model.CalendarEvent
import com.example.mylifecalendar.data.model.DayRemark
import com.example.mylifecalendar.data.model.NoteEntry
import com.example.mylifecalendar.data.model.UserProfile
import kotlinx.coroutines.flow.Flow

class LifeCalendarRepository(private val database: AppDatabase) {
    val userProfile: Flow<UserProfile?> = database.userProfileDao().getUserProfile()
    val allEvents: Flow<List<CalendarEvent>> = database.calendarEventDao().getAllEvents()
    val allNotes: Flow<List<NoteEntry>> = database.noteDao().getAllNotes()
    val allRemarks: Flow<List<DayRemark>> = database.dayRemarkDao().getAllRemarks()

    suspend fun getUserProfileDirect(): UserProfile? =
        database.userProfileDao().getUserProfileDirect()

    suspend fun saveUserProfile(profile: UserProfile) {
        database.userProfileDao().saveUserProfile(profile)
    }

    fun getEventsForDate(date: String): Flow<List<CalendarEvent>> =
        database.calendarEventDao().getEventsByDate(date)

    suspend fun addEvent(event: CalendarEvent) {
        database.calendarEventDao().insertEvent(event)
    }

    suspend fun updateEvent(event: CalendarEvent) {
        database.calendarEventDao().updateEvent(event)
    }

    suspend fun deleteEvent(id: String) {
        database.calendarEventDao().deleteEventById(id)
    }

    fun getNotesForDate(date: String): Flow<List<NoteEntry>> =
        database.noteDao().getNotesByDate(date)

    suspend fun saveNote(note: NoteEntry) {
        database.noteDao().insertNote(note)
    }

    suspend fun deleteNote(id: String) {
        database.noteDao().deleteNoteById(id)
    }

    suspend fun setDayRemark(date: String, verdict: String) {
        database.dayRemarkDao().setRemark(DayRemark(date = date, verdict = verdict))
    }

    suspend fun clearDayRemark(date: String) {
        database.dayRemarkDao().deleteRemark(date)
    }
}
