package com.example.mylifecalendar.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "day_remarks")
data class DayRemark(
    @PrimaryKey val date: String, // YYYY-MM-DD
    val verdict: String // "yes" or "no"
)
