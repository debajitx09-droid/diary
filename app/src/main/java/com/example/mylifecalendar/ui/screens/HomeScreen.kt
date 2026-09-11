package com.example.mylifecalendar.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.Cake
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Today
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material.icons.filled.WbTwilight
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mylifecalendar.data.model.CalendarEvent
import com.example.mylifecalendar.data.model.EventType
import com.example.mylifecalendar.ui.theme.AuroraEmerald
import com.example.mylifecalendar.ui.theme.DawnRose
import com.example.mylifecalendar.ui.theme.StarGold
import com.example.mylifecalendar.ui.theme.SunAmber
import com.example.mylifecalendar.ui.viewmodel.LifeCalendarViewModel
import com.example.mylifecalendar.util.SkyPeriod
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
fun HomeScreen(
    viewModel: LifeCalendarViewModel,
    modifier: Modifier = Modifier
) {
    val selectedDate by viewModel.selectedDate.collectAsState()
    val userProfile by viewModel.userProfile.collectAsState()
    val allEvents by viewModel.allEvents.collectAsState()
    val allRemarks by viewModel.allRemarks.collectAsState()

    val skyState = viewModel.getSkyState()
    val moonPhase = viewModel.getMoonPhase(selectedDate)
    val lifeStats = viewModel.calculateLifeStats(userProfile?.dob, selectedDate)

    val dateStr = selectedDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
    val currentRemark = allRemarks.find { it.date == dateStr }
    val isToday = selectedDate.isEqual(LocalDate.now())

    val eventsForToday = allEvents.filter { it.date == dateStr }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("home_screen_content"),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // TOP TOOLBAR & SKY BADGE
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Sky state pill
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Color(0xFF1E293B).copy(alpha = 0.85f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155)),
                    modifier = Modifier
                        .clickable { viewModel.showCelestialDialog.value = true }
                        .testTag("sky_badge")
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = when (skyState.period) {
                                SkyPeriod.DAWN, SkyPeriod.SUNSET -> Icons.Default.WbTwilight
                                SkyPeriod.MORNING, SkyPeriod.AFTERNOON -> Icons.Default.WbSunny
                                SkyPeriod.NIGHT -> Icons.Default.Bedtime
                            },
                            contentDescription = "Sky Period",
                            tint = StarGold,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "${skyState.period.label} • ${skyState.timeFormatted}",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                // Action buttons: Celestial, Calendar, Theme
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(
                        onClick = { viewModel.showCelestialDialog.value = true },
                        modifier = Modifier.testTag("open_celestial_dialog_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Bedtime,
                            contentDescription = "Celestial Simulation",
                            tint = StarGold
                        )
                    }

                    IconButton(
                        onClick = { viewModel.showCalendarDialog.value = true },
                        modifier = Modifier.testTag("open_calendar_dialog_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.CalendarMonth,
                            contentDescription = "Open Calendar",
                            tint = Color.White
                        )
                    }

                    IconButton(
                        onClick = { viewModel.toggleTheme() },
                        modifier = Modifier.testTag("toggle_theme_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.LightMode,
                            contentDescription = "Toggle Theme",
                            tint = Color.White
                        )
                    }
                }
            }
        }

        // DATE NAVIGATION BAR
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E).copy(alpha = 0.9f)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("date_navigation_card")
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { viewModel.goToPreviousDay() },
                        modifier = Modifier.testTag("prev_day_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Previous Day",
                            tint = Color.White
                        )
                    }

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.clickable { viewModel.showCalendarDialog.value = true }
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = selectedDate.format(DateTimeFormatter.ofPattern("EEEE, MMM d, yyyy")),
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                            if (isToday) {
                                Spacer(modifier = Modifier.width(6.dp))
                                Box(
                                    modifier = Modifier
                                        .background(StarGold, CircleShape)
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = "TODAY",
                                        color = Color.Black,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        Text(
                            text = "Moon: ${moonPhase.phaseName} (${(moonPhase.illumination * 100).toInt()}%)",
                            color = Color(0xFF94A3B8),
                            fontSize = 12.sp
                        )
                    }

                    Row {
                        if (!isToday) {
                            IconButton(
                                onClick = { viewModel.goToToday() },
                                modifier = Modifier.testTag("go_to_today_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Today,
                                    contentDescription = "Go to Today",
                                    tint = StarGold
                                )
                            }
                        }

                        IconButton(
                            onClick = { viewModel.goToNextDay() },
                            modifier = Modifier.testTag("next_day_button")
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                contentDescription = "Next Day",
                                tint = Color.White
                            )
                        }
                    }
                }
            }
        }

        // HERO LIFE COUNTER CARD
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                border = androidx.compose.foundation.BorderStroke(1.dp, StarGold.copy(alpha = 0.3f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("life_counter_card")
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "TOTAL DAYS LIVED",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = StarGold,
                        letterSpacing = 1.5.sp
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "%,d".format(lifeStats.daysLived),
                        fontSize = 44.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )

                    Text(
                        text = "${lifeStats.ageYears} years, ${lifeStats.ageMonths} months, ${lifeStats.ageDays} days",
                        fontSize = 14.sp,
                        color = Color(0xFFCBD5E1),
                        fontWeight = FontWeight.Medium
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // 3 mini stats in a row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        MiniStat(
                            label = "Weeks Lived",
                            value = "%,d".format(lifeStats.weeksLived)
                        )
                        Box(
                            modifier = Modifier
                                .width(1.dp)
                                .height(32.dp)
                                .background(Color(0xFF334155))
                        )
                        MiniStat(
                            label = "Months Lived",
                            value = "%,d".format(lifeStats.monthsLived)
                        )
                        Box(
                            modifier = Modifier
                                .width(1.dp)
                                .height(32.dp)
                                .background(Color(0xFF334155))
                        )
                        MiniStat(
                            label = "Next Birthday",
                            value = "${lifeStats.daysUntilNextBirthday}d"
                        )
                    }
                }
            }
        }

        // QUICK VERDICT CARD
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF161F33)),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("quick_verdict_card")
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = userProfile?.remarkQuestion ?: "Was the day yours?",
                            color = Color.White,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 15.sp
                        )
                        Text(
                            text = when (currentRemark?.verdict) {
                                "yes" -> "Verdict: Owned the day! 🔥"
                                "no" -> "Verdict: Tough day, reset tomorrow 🥲"
                                else -> "Not answered yet"
                            },
                            color = when (currentRemark?.verdict) {
                                "yes" -> AuroraEmerald
                                "no" -> DawnRose
                                else -> Color(0xFF94A3B8)
                            },
                            fontSize = 12.sp
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = { viewModel.setDayVerdict(selectedDate, "yes") },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (currentRemark?.verdict == "yes") AuroraEmerald else Color(0xFF1E293B),
                                contentColor = Color.White
                            ),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            modifier = Modifier.testTag("quick_verdict_yes_button")
                        ) {
                            Text("YES 🔥", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = { viewModel.setDayVerdict(selectedDate, "no") },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (currentRemark?.verdict == "no") DawnRose else Color(0xFF1E293B),
                                contentColor = Color.White
                            ),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            modifier = Modifier.testTag("quick_verdict_no_button")
                        ) {
                            Text("NO 🥲", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // PROGRESS BARS (Life, Year, Month)
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("progress_meters_card")
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    ProgressRow(
                        title = "Life Progress (${userProfile?.lifeExpectancy ?: 80} yrs)",
                        subtitle = "${(lifeStats.lifeProgress * 100).toInt()}% • %,d days remaining".format(lifeStats.remainingDays),
                        progress = lifeStats.lifeProgress,
                        color = StarGold
                    )

                    ProgressRow(
                        title = "Year ${selectedDate.year} Progress",
                        subtitle = "Day ${lifeStats.dayOfYear} of ${lifeStats.daysInYear} • ${(lifeStats.yearProgress * 100).toInt()}%",
                        progress = lifeStats.yearProgress,
                        color = SunAmber
                    )

                    ProgressRow(
                        title = "${selectedDate.month.name} Progress",
                        subtitle = "Day ${selectedDate.dayOfMonth} of ${selectedDate.lengthOfMonth()} • ${(lifeStats.monthProgress * 100).toInt()}%",
                        progress = lifeStats.monthProgress,
                        color = Color(0xFF38BDF8)
                    )
                }
            }
        }

        // IMPORTANT EVENTS SECTION
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Important Events",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                OutlinedButton(
                    onClick = { viewModel.showAddEventDialog.value = true },
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                    modifier = Modifier.testTag("add_event_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = StarGold
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "Schedule Event", fontSize = 12.sp, color = StarGold)
                }
            }
        }

        if (allEvents.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E).copy(alpha = 0.5f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No events scheduled yet. Tap '+ Schedule Event' to add birthdays, milestones, and anniversaries.",
                            color = Color(0xFF94A3B8),
                            fontSize = 13.sp,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }
            }
        } else {
            items(allEvents) { event ->
                EventCard(
                    event = event,
                    isSelectedDate = event.date == dateStr,
                    onDelete = { viewModel.deleteEvent(event.id) }
                )
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun MiniStat(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
        Text(text = label, color = Color(0xFF94A3B8), fontSize = 11.sp)
    }
}

@Composable
private fun ProgressRow(
    title: String,
    subtitle: String,
    progress: Float,
    color: Color
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = title, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium)
            Text(text = subtitle, color = Color(0xFF94A3B8), fontSize = 12.sp)
        }
        Spacer(modifier = Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp)),
            color = color,
            trackColor = Color(0xFF1E293B)
        )
    }
}

@Composable
private fun EventCard(
    event: CalendarEvent,
    isSelectedDate: Boolean,
    onDelete: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelectedDate) Color(0xFF1E293B) else Color(0xFF131B2E)
        ),
        border = if (isSelectedDate) androidx.compose.foundation.BorderStroke(1.dp, StarGold) else null,
        modifier = Modifier
            .fillMaxWidth()
            .testTag("event_item_${event.id}")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(
                            when (event.type) {
                                EventType.BIRTHDAY -> SunAmber.copy(alpha = 0.2f)
                                EventType.ANNIVERSARY -> DawnRose.copy(alpha = 0.2f)
                                EventType.MILESTONE -> AuroraEmerald.copy(alpha = 0.2f)
                                EventType.CUSTOM -> StarGold.copy(alpha = 0.2f)
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = when (event.type) {
                            EventType.BIRTHDAY -> Icons.Default.Cake
                            EventType.ANNIVERSARY -> Icons.Default.Favorite
                            EventType.MILESTONE -> Icons.Default.Star
                            EventType.CUSTOM -> Icons.Default.Event
                        },
                        contentDescription = null,
                        tint = when (event.type) {
                            EventType.BIRTHDAY -> SunAmber
                            EventType.ANNIVERSARY -> DawnRose
                            EventType.MILESTONE -> AuroraEmerald
                            EventType.CUSTOM -> StarGold
                        },
                        modifier = Modifier.size(18.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Text(
                        text = event.title,
                        color = Color.White,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                    Text(
                        text = "${event.date} • ${event.type.displayName}",
                        color = Color(0xFF94A3B8),
                        fontSize = 12.sp
                    )
                }
            }

            IconButton(
                onClick = onDelete,
                modifier = Modifier.testTag("delete_event_${event.id}")
            ) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Delete Event",
                    tint = Color(0xFF64748B),
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}
