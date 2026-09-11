package com.example.mylifecalendar.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class DayRating(val displayName: String, val emoji: String) {
    GOOD("Good", "😊"),
    BAD("Bad", "😔"),
    NEUTRAL("Neutral", "😐")
}

@Entity(tableName = "notes")
data class NoteEntry(
    @PrimaryKey val id: String,
    val date: String, // YYYY-MM-DD
    val title: String,
    val content: String,
    val tags: String = "", // Comma-separated tags
    val dayRating: DayRating? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    fun getTagsList(): List<String> =
        if (tags.isBlank()) emptyList() else tags.split(",").map { it.trim() }.filter { it.isNotEmpty() }
}
