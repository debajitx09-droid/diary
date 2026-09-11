package com.example.mylifecalendar.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import com.example.mylifecalendar.data.model.CalendarEvent
import com.example.mylifecalendar.data.model.DayRating
import com.example.mylifecalendar.data.model.DayRemark
import com.example.mylifecalendar.data.model.EventType
import com.example.mylifecalendar.data.model.NoteEntry
import com.example.mylifecalendar.data.model.UserProfile

class Converters {
    @TypeConverter
    fun fromEventType(value: EventType?): String = value?.name ?: EventType.CUSTOM.name

    @TypeConverter
    fun toEventType(value: String?): EventType =
        try {
            value?.let { EventType.valueOf(it) } ?: EventType.CUSTOM
        } catch (e: Exception) {
            EventType.CUSTOM
        }

    @TypeConverter
    fun fromDayRating(value: DayRating?): String? = value?.name

    @TypeConverter
    fun toDayRating(value: String?): DayRating? =
        try {
            value?.let { DayRating.valueOf(it) }
        } catch (e: Exception) {
            null
        }
}

@Database(
    entities = [
        CalendarEvent::class,
        NoteEntry::class,
        DayRemark::class,
        UserProfile::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun calendarEventDao(): CalendarEventDao
    abstract fun noteDao(): NoteDao
    abstract fun dayRemarkDao(): DayRemarkDao
    abstract fun userProfileDao(): UserProfileDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "life_calendar_database"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
