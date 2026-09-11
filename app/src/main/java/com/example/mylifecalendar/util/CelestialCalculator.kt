package com.example.mylifecalendar.util

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneOffset
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

enum class SkyPeriod(val label: String) {
    DAWN("Dawn"),
    MORNING("Morning"),
    AFTERNOON("Afternoon"),
    SUNSET("Sunset"),
    NIGHT("Night")
}

enum class Season(val label: String) {
    SUMMER("Summer"),
    WINTER("Winter")
}

data class SkyState(
    val period: SkyPeriod,
    val season: Season,
    val sunAltitude: Float,
    val moonAltitude: Float,
    val timeFormatted: String
)

data class MoonPhase(
    val phaseIndex: Int, // 0..7
    val phaseName: String,
    val illumination: Float, // 0.0 .. 1.0
    val fortnightDay: Int, // 1..15
    val fortnightName: String, // Shukla Paksha or Krishna Paksha
    val isWaxing: Boolean
)

object CelestialCalculator {
    private const val SYNODIC_MONTH = 29.53058867 // days
    // Reference new moon: Jan 6, 2000, 18:14 UTC
    private const val REFERENCE_NEW_MOON_EPOCH_MS = 947182440000L

    private val PHASE_NAMES = listOf(
        "New Moon",
        "Waxing Crescent",
        "First Quarter",
        "Waxing Gibbous",
        "Full Moon",
        "Waning Gibbous",
        "Last Quarter",
        "Waning Crescent"
    )

    fun getSkyState(
        dateTime: LocalDateTime,
        forcedPeriod: SkyPeriod? = null,
        forcedSeason: Season? = null
    ): SkyState {
        val hour = dateTime.hour
        val month = dateTime.monthValue

        val season = forcedSeason ?: if (month in 4..9) Season.SUMMER else Season.WINTER

        val period = forcedPeriod ?: when (hour) {
            in 5..6 -> SkyPeriod.DAWN
            in 7..11 -> SkyPeriod.MORNING
            in 12..16 -> SkyPeriod.AFTERNOON
            in 17..18 -> SkyPeriod.SUNSET
            else -> SkyPeriod.NIGHT
        }

        // Calculate solar / lunar altitude based on hour
        val hourAngle = (hour + dateTime.minute / 60.0) / 24.0 * 2.0 * Math.PI - Math.PI / 2.0
        val sunAlt = sin(hourAngle).toFloat()
        val moonAlt = (-sin(hourAngle)).toFloat()

        val timeStr = String.format("%02d:%02d", hour, dateTime.minute)

        return SkyState(
            period = period,
            season = season,
            sunAltitude = sunAlt,
            moonAltitude = moonAlt,
            timeFormatted = timeStr
        )
    }

    fun getMoonPhase(date: LocalDate): MoonPhase {
        val epochMs = date.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
        val daysSinceNewMoon = (epochMs - REFERENCE_NEW_MOON_EPOCH_MS) / (1000.0 * 60 * 60 * 24)
        val cyclePosition = (daysSinceNewMoon % SYNODIC_MONTH + SYNODIC_MONTH) % SYNODIC_MONTH

        val phaseFraction = cyclePosition / SYNODIC_MONTH
        val phaseIndex = (phaseFraction * 8.0).toInt().coerceIn(0, 7)

        // Fortnight day: 1 to 15
        val fortnightDay = ((cyclePosition % (SYNODIC_MONTH / 2.0)) + 1).toInt().coerceIn(1, 15)
        val isWaxing = cyclePosition < (SYNODIC_MONTH / 2.0)
        val fortnightName = if (isWaxing) "Shukla Paksha" else "Krishna Paksha"

        // Illumination: 0 at new moon, 1 at full moon
        val illumination = ((1.0 - cos(phaseFraction * 2.0 * Math.PI)) / 2.0).toFloat()

        return MoonPhase(
            phaseIndex = phaseIndex,
            phaseName = PHASE_NAMES[phaseIndex],
            illumination = illumination,
            fortnightDay = fortnightDay,
            fortnightName = fortnightName,
            isWaxing = isWaxing
        )
    }
}
