package com.example.mylifecalendar.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mylifecalendar.ui.theme.AuroraEmerald
import com.example.mylifecalendar.ui.theme.DawnRose
import com.example.mylifecalendar.ui.theme.StarGold
import com.example.mylifecalendar.ui.viewmodel.LifeCalendarViewModel
import java.time.format.DateTimeFormatter

@Composable
fun RemarkScreen(
    viewModel: LifeCalendarViewModel,
    modifier: Modifier = Modifier
) {
    val selectedDate by viewModel.selectedDate.collectAsState()
    val userProfile by viewModel.userProfile.collectAsState()
    val allRemarks by viewModel.allRemarks.collectAsState()

    val dateStr = selectedDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
    val currentRemark = allRemarks.find { it.date == dateStr }

    val yesCount = allRemarks.count { it.verdict == "yes" }
    val noCount = allRemarks.count { it.verdict == "no" }
    val totalTracked = yesCount + noCount
    val winRate = if (totalTracked > 0) ((yesCount.toFloat() / totalTracked.toFloat()) * 100).toInt() else 0

    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
            .testTag("remark_screen_content"),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        // QUESTION CARD
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("remark_question_card")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "DAILY ASSESSMENT",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = StarGold,
                        letterSpacing = 1.2.sp
                    )

                    IconButton(
                        onClick = { viewModel.showRemarkSettingsDialog.value = true },
                        modifier = Modifier.testTag("edit_remark_question_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Edit Question",
                            tint = Color(0xFF94A3B8),
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = userProfile?.remarkQuestion ?: "Was the day yours?",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = selectedDate.format(DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy")),
                    color = Color(0xFF94A3B8),
                    fontSize = 13.sp
                )
            }
        }

        // BIG YES / NO CHOICE BUTTONS
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // YES BUTTON
            Button(
                onClick = { viewModel.setDayVerdict(selectedDate, "yes") },
                modifier = Modifier
                    .weight(1f)
                    .height(90.dp)
                    .testTag("verdict_yes_button"),
                shape = RoundedCornerShape(18.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (currentRemark?.verdict == "yes") AuroraEmerald else Color(0xFF142921),
                    contentColor = Color.White
                ),
                border = androidx.compose.foundation.BorderStroke(
                    width = if (currentRemark?.verdict == "yes") 2.dp else 1.dp,
                    color = if (currentRemark?.verdict == "yes") AuroraEmerald else AuroraEmerald.copy(alpha = 0.4f)
                )
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        tint = if (currentRemark?.verdict == "yes") Color.White else AuroraEmerald,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "YES 🔥",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            }

            // NO BUTTON
            Button(
                onClick = { viewModel.setDayVerdict(selectedDate, "no") },
                modifier = Modifier
                    .weight(1f)
                    .height(90.dp)
                    .testTag("verdict_no_button"),
                shape = RoundedCornerShape(18.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (currentRemark?.verdict == "no") DawnRose else Color(0xFF291418),
                    contentColor = Color.White
                ),
                border = androidx.compose.foundation.BorderStroke(
                    width = if (currentRemark?.verdict == "no") 2.dp else 1.dp,
                    color = if (currentRemark?.verdict == "no") DawnRose else DawnRose.copy(alpha = 0.4f)
                )
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = null,
                        tint = if (currentRemark?.verdict == "no") Color.White else DawnRose,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "NO 🥲",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            }
        }

        // VERDICT STATE DISPLAY
        if (currentRemark != null) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (currentRemark.verdict == "yes") Color(0xFF0D2818) else Color(0xFF2A1015)
                ),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (currentRemark.verdict == "yes") AuroraEmerald.copy(alpha = 0.4f) else DawnRose.copy(alpha = 0.4f)
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("verdict_display_card")
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = if (currentRemark.verdict == "yes") "LET'S GOOOOO.... 🔥" else "Oooo... it's so sad 🥲",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = if (currentRemark.verdict == "yes") AuroraEmerald else DawnRose
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = if (currentRemark.verdict == "yes")
                            "The day was yours! You showed up, owned your hours, and conquered today."
                        else
                            "Not quite your day, but remember: progress isn't linear. Reset tonight and attack tomorrow with fresh energy.",
                        color = Color(0xFFCBD5E1),
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedButton(
                        onClick = { viewModel.clearDayVerdict(selectedDate) },
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                        modifier = Modifier.testTag("reset_verdict_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = Color(0xFF94A3B8)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "Reset Verdict", color = Color(0xFF94A3B8), fontSize = 13.sp)
                    }
                }
            }
        }

        // REMARK STATS
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("remark_stats_card")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Lifetime Verdict Stats",
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 15.sp
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.EmojiEvents,
                            contentDescription = null,
                            tint = StarGold,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "$winRate% Win Rate",
                            color = StarGold,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "$yesCount", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = AuroraEmerald)
                        Text(text = "Days Owned 🔥", fontSize = 12.sp, color = Color(0xFF94A3B8))
                    }
                    Box(
                        modifier = Modifier
                            .width(1.dp)
                            .height(36.dp)
                            .background(Color(0xFF334155))
                    )
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "$noCount", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = DawnRose)
                        Text(text = "Tough Days 🥲", fontSize = 12.sp, color = Color(0xFF94A3B8))
                    }
                    Box(
                        modifier = Modifier
                            .width(1.dp)
                            .height(36.dp)
                            .background(Color(0xFF334155))
                    )
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "$totalTracked", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text(text = "Days Tracked", fontSize = 12.sp, color = Color(0xFF94A3B8))
                    }
                }
            }
        }
    }
}
