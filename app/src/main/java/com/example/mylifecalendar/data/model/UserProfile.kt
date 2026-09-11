package com.example.mylifecalendar.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "user_profile")
data class UserProfile(
    @PrimaryKey val id: Int = 1,
    val dob: String? = null, // YYYY-MM-DD
    val lifeExpectancy: Int = 80,
    val remarkQuestion: String = "Was the day yours?",
    val themeMode: String = "dark" // "light", "dark", "system"
)
