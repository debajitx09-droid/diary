package com.example.mylifecalendar.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class EventType(val displayName: String) {
    BIRTHDAY("Birthday"),
    ANNIVERSARY("Anniversary"),
    MILESTONE("Milestone"),
    CUSTOM("Custom")
}

@Entity(tableName = "calendar_events")
data class CalendarEvent(
    @PrimaryKey val id: String,
    val date: String, // YYYY-MM-DD
    val title: String,
    val type: EventType = EventType.CUSTOM,
    val description: String = ""
)
