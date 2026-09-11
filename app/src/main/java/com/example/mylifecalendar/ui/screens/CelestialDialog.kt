package com.example.mylifecalendar.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material.icons.filled.WbTwilight
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.mylifecalendar.ui.theme.StarGold
import com.example.mylifecalendar.ui.viewmodel.LifeCalendarViewModel
import com.example.mylifecalendar.util.Season
import com.example.mylifecalendar.util.SkyPeriod

@Composable
fun CelestialDialog(
    viewModel: LifeCalendarViewModel,
    onDismiss: () -> Unit
) {
    val simulatedPeriod by viewModel.simulatedPeriod.collectAsState()
    val simulatedSeason by viewModel.simulatedSeason.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()

    val skyState = viewModel.getSkyState()
    val moonPhase = viewModel.getMoonPhase(selectedDate)

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
            modifier = Modifier
                .fillMaxWidth()
                .padding(4.dp)
                .testTag("celestial_dialog_card")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Bedtime,
                            contentDescription = null,
                            tint = StarGold,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Sky & Celestial Simulator",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }

                    IconButton(onClick = onDismiss, modifier = Modifier.testTag("close_celestial_dialog")) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color(0xFF94A3B8))
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Time of day selector
                Text(
                    text = "TIME OF DAY OVERRIDE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = StarGold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))

                val periods = listOf(
                    null to "Live",
                    SkyPeriod.DAWN to "Dawn",
                    SkyPeriod.MORNING to "Morning",
                    SkyPeriod.AFTERNOON to "Afternoon",
                    SkyPeriod.SUNSET to "Sunset",
                    SkyPeriod.NIGHT to "Night"
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    periods.take(3).forEach { (period, label) ->
                        val isSelected = simulatedPeriod == period
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = if (isSelected) StarGold else Color(0xFF1E293B),
                            modifier = Modifier
                                .weight(1f)
                                .clickable { viewModel.setSimulatedPeriod(period) }
                                .testTag("celestial_period_$label")
                        ) {
                            Text(
                                text = label,
                                color = if (isSelected) Color.Black else Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(vertical = 8.dp),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    periods.drop(3).forEach { (period, label) ->
                        val isSelected = simulatedPeriod == period
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = if (isSelected) StarGold else Color(0xFF1E293B),
                            modifier = Modifier
                                .weight(1f)
                                .clickable { viewModel.setSimulatedPeriod(period) }
                                .testTag("celestial_period_$label")
                        ) {
                            Text(
                                text = label,
                                color = if (isSelected) Color.Black else Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(vertical = 8.dp),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Season selector
                Text(
                    text = "SEASON OVERRIDE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = StarGold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf(
                        null to "Live Season",
                        Season.SUMMER to "Summer ☀️",
                        Season.WINTER to "Winter ❄️"
                    ).forEach { (season, label) ->
                        val isSelected = simulatedSeason == season
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = if (isSelected) StarGold else Color(0xFF1E293B),
                            modifier = Modifier
                                .weight(1f)
                                .clickable { viewModel.setSimulatedSeason(season) }
                                .testTag("celestial_season_${season?.name ?: "live"}")
                        ) {
                            Text(
                                text = label,
                                color = if (isSelected) Color.Black else Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(vertical = 8.dp),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Astronomical Details Box
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        AstroRow("Moon Phase", "${moonPhase.phaseName} (${(moonPhase.illumination * 100).toInt()}%)")
                        AstroRow("Fortnight", "${moonPhase.fortnightName} (Day ${moonPhase.fortnightDay}/15)")
                        AstroRow("Cycle", if (moonPhase.isWaxing) "Waxing (Growing)" else "Waning (Shrinking)")
                        AstroRow("Sun Altitude", "%.2f".format(skyState.sunAltitude))
                        AstroRow("Moon Altitude", "%.2f".format(skyState.moonAltitude))
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        viewModel.setSimulatedPeriod(null)
                        viewModel.setSimulatedSeason(null)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp)
                        .testTag("reset_celestial_simulation_button"),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B))
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "Reset to Live Celestial Clock", fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
private fun AstroRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, color = Color(0xFF94A3B8), fontSize = 12.sp)
        Text(text = value, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Medium)
    }
}
