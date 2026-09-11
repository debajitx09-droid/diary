package com.example.mylifecalendar.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.mylifecalendar.data.db.AppDatabase
import com.example.mylifecalendar.data.model.CalendarEvent
import com.example.mylifecalendar.data.model.DayRating
import com.example.mylifecalendar.data.model.DayRemark
import com.example.mylifecalendar.data.model.EventType
import com.example.mylifecalendar.data.model.NoteEntry
import com.example.mylifecalendar.data.model.UserProfile
import com.example.mylifecalendar.data.repository.LifeCalendarRepository
import com.example.mylifecalendar.util.CelestialCalculator
import com.example.mylifecalendar.util.MoonPhase
import com.example.mylifecalendar.util.Season
import com.example.mylifecalendar.util.SkyPeriod
import com.example.mylifecalendar.util.SkyState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.Period
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.UUID

data class LifeStats(
    val daysLived: Long = 0,
    val weeksLived: Long = 0,
    val monthsLived: Long = 0,
    val ageYears: Int = 0,
    val ageMonths: Int = 0,
    val ageDays: Int = 0,
    val daysUntilNextBirthday: Long = 0,
    val dayOfYear: Int = 1,
    val daysInYear: Int = 365,
    val yearProgress: Float = 0f,
    val monthProgress: Float = 0f,
    val lifeProgress: Float = 0f,
    val expectedDays: Long = 0,
    val remainingDays: Long = 0
)

class LifeCalendarViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = LifeCalendarRepository(AppDatabase.getDatabase(application))

    val userProfile = repository.userProfile.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        null
    )

    val allEvents = repository.allEvents.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    val allNotes = repository.allNotes.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    val allRemarks = repository.allRemarks.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    private val _selectedDate = MutableStateFlow(LocalDate.now())
    val selectedDate: StateFlow<LocalDate> = _selectedDate.asStateFlow()

    private val _activeTab = MutableStateFlow(1) // 0: Remark, 1: Home, 2: Note
    val activeTab: StateFlow<Int> = _activeTab.asStateFlow()

    // Simulation overrides
    private val _simulatedPeriod = MutableStateFlow<SkyPeriod?>(null)
    val simulatedPeriod: StateFlow<SkyPeriod?> = _simulatedPeriod.asStateFlow()

    private val _simulatedSeason = MutableStateFlow<Season?>(null)
    val simulatedSeason: StateFlow<Season?> = _simulatedSeason.asStateFlow()

    // Dialogs
    val showCalendarDialog = MutableStateFlow(false)
    val showCelestialDialog = MutableStateFlow(false)
    val showAddEventDialog = MutableStateFlow(false)
    val showNoteEditorDialog = MutableStateFlow(false)
    val showRemarkSettingsDialog = MutableStateFlow(false)
    val viewingNote = MutableStateFlow<NoteEntry?>(null)
    val editingNote = MutableStateFlow<NoteEntry?>(null)

    val dateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    fun setSelectedDate(date: LocalDate) {
        _selectedDate.value = date
    }

    fun goToToday() {
        _selectedDate.value = LocalDate.now()
    }

    fun goToPreviousDay() {
        _selectedDate.value = _selectedDate.value.minusDays(1)
    }

    fun goToNextDay() {
        _selectedDate.value = _selectedDate.value.plusDays(1)
    }

    fun setActiveTab(tab: Int) {
        _activeTab.value = tab
    }

    fun setSimulatedPeriod(period: SkyPeriod?) {
        _simulatedPeriod.value = period
    }

    fun setSimulatedSeason(season: Season?) {
        _simulatedSeason.value = season
    }

    // Save DOB & profile
    fun setDateOfBirth(dob: String) {
        viewModelScope.launch {
            val current = repository.getUserProfileDirect() ?: UserProfile()
            repository.saveUserProfile(current.copy(dob = dob))
        }
    }

    fun updateRemarkQuestion(question: String) {
        viewModelScope.launch {
            val current = repository.getUserProfileDirect() ?: UserProfile()
            repository.saveUserProfile(current.copy(remarkQuestion = question))
        }
    }

    fun toggleTheme() {
        viewModelScope.launch {
            val current = repository.getUserProfileDirect() ?: UserProfile()
            val nextTheme = when (current.themeMode) {
                "dark" -> "light"
                "light" -> "dark"
                else -> "dark"
            }
            repository.saveUserProfile(current.copy(themeMode = nextTheme))
        }
    }

    // Remark actions
    fun setDayVerdict(date: LocalDate, verdict: String) {
        viewModelScope.launch {
            repository.setDayRemark(date.format(dateFormatter), verdict)
        }
    }

    fun clearDayVerdict(date: LocalDate) {
        viewModelScope.launch {
            repository.clearDayRemark(date.format(dateFormatter))
        }
    }

    // Note actions
    fun saveNote(
        id: String? = null,
        title: String,
        content: String,
        rating: DayRating? = null,
        tags: String = ""
    ) {
        viewModelScope.launch {
            val noteId = id ?: UUID.randomUUID().toString()
            val dateStr = _selectedDate.value.format(dateFormatter)
            val note = NoteEntry(
                id = noteId,
                date = dateStr,
                title = title,
                content = content,
                tags = tags,
                dayRating = rating,
                updatedAt = System.currentTimeMillis()
            )
            repository.saveNote(note)
            showNoteEditorDialog.value = false
            editingNote.value = null
        }
    }

    fun deleteNote(id: String) {
        viewModelScope.launch {
            repository.deleteNote(id)
            if (viewingNote.value?.id == id) {
                viewingNote.value = null
            }
        }
    }

    // Event actions
    fun addEvent(title: String, type: EventType, description: String, date: LocalDate) {
        viewModelScope.launch {
            val event = CalendarEvent(
                id = UUID.randomUUID().toString(),
                date = date.format(dateFormatter),
                title = title,
                type = type,
                description = description
            )
            repository.addEvent(event)
            showAddEventDialog.value = false
        }
    }

    fun deleteEvent(id: String) {
        viewModelScope.launch {
            repository.deleteEvent(id)
        }
    }

    // Celestial state
    fun getSkyState(dateTime: LocalDateTime = LocalDateTime.now()): SkyState {
        return CelestialCalculator.getSkyState(
            dateTime = dateTime,
            forcedPeriod = _simulatedPeriod.value,
            forcedSeason = _simulatedSeason.value
        )
    }

    fun getMoonPhase(date: LocalDate = _selectedDate.value): MoonPhase {
        return CelestialCalculator.getMoonPhase(date)
    }

    // Calculate LifeStats for a given DOB & targetDate
    fun calculateLifeStats(dobStr: String?, targetDate: LocalDate = _selectedDate.value): LifeStats {
        if (dobStr.isNullOrBlank()) return LifeStats()
        return try {
            val dob = LocalDate.parse(dobStr)
            val daysLived = ChronoUnit.DAYS.between(dob, targetDate).coerceAtLeast(0)
            val weeksLived = daysLived / 7
            val monthsLived = ChronoUnit.MONTHS.between(dob, targetDate).coerceAtLeast(0)

            val period = Period.between(dob, targetDate)
            val ageYears = period.years.coerceAtLeast(0)
            val ageMonths = period.months.coerceAtLeast(0)
            val ageDays = period.days.coerceAtLeast(0)

            // Next Birthday
            var nextBday = dob.withYear(targetDate.year)
            if (nextBday.isBefore(targetDate) || nextBday.isEqual(targetDate)) {
                nextBday = dob.withYear(targetDate.year + 1)
            }
            val daysUntilBday = ChronoUnit.DAYS.between(targetDate, nextBday)

            // Year Progress
            val dayOfYear = targetDate.dayOfYear
            val daysInYear = if (targetDate.isLeapYear) 366 else 365
            val yearProg = (dayOfYear.toFloat() / daysInYear.toFloat()).coerceIn(0f, 1f)

            // Month Progress
            val dayOfMonth = targetDate.dayOfMonth
            val daysInMonth = targetDate.lengthOfMonth()
            val monthProg = (dayOfMonth.toFloat() / daysInMonth.toFloat()).coerceIn(0f, 1f)

            // Life Progress
            val expectedYears = userProfile.value?.lifeExpectancy ?: 80
            val expectedDays = (expectedYears * 365.25).toLong()
            val lifeProg = (daysLived.toFloat() / expectedDays.toFloat()).coerceIn(0f, 1f)
            val remainingDays = (expectedDays - daysLived).coerceAtLeast(0)

            LifeStats(
                daysLived = daysLived,
                weeksLived = weeksLived,
                monthsLived = monthsLived,
                ageYears = ageYears,
                ageMonths = ageMonths,
                ageDays = ageDays,
                daysUntilNextBirthday = daysUntilBday,
                dayOfYear = dayOfYear,
                daysInYear = daysInYear,
                yearProgress = yearProg,
                monthProgress = monthProg,
                lifeProgress = lifeProg,
                expectedDays = expectedDays,
                remainingDays = remainingDays
            )
        } catch (e: Exception) {
            LifeStats()
        }
    }
}
