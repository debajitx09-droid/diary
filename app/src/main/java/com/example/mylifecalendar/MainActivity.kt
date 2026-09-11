package com.example.mylifecalendar

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Note
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mylifecalendar.ui.components.CelestialSkyBackground
import com.example.mylifecalendar.ui.screens.AddEventDialog
import com.example.mylifecalendar.ui.screens.CalendarDialog
import com.example.mylifecalendar.ui.screens.CelestialDialog
import com.example.mylifecalendar.ui.screens.HomeScreen
import com.example.mylifecalendar.ui.screens.NoteEditorDialog
import com.example.mylifecalendar.ui.screens.NoteViewerDialog
import com.example.mylifecalendar.ui.screens.NotesScreen
import com.example.mylifecalendar.ui.screens.RemarkScreen
import com.example.mylifecalendar.ui.screens.RemarkSettingsDialog
import com.example.mylifecalendar.ui.screens.SetupScreen
import com.example.mylifecalendar.ui.theme.MyLifeCalendarTheme
import com.example.mylifecalendar.ui.theme.StarGold
import com.example.mylifecalendar.ui.viewmodel.LifeCalendarViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: LifeCalendarViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val userProfile by viewModel.userProfile.collectAsState()
            val isDark = userProfile?.themeMode != "light"

            MyLifeCalendarTheme(darkTheme = isDark) {
                if (userProfile?.dob == null) {
                    SetupScreen(
                        onSaveDob = { dob ->
                            viewModel.setDateOfBirth(dob)
                        }
                    )
                } else {
                    LifeCalendarApp(viewModel = viewModel)
                }
            }
        }
    }
}

@Composable
fun LifeCalendarApp(viewModel: LifeCalendarViewModel) {
    val activeTab by viewModel.activeTab.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()

    val showCalendarDialog by viewModel.showCalendarDialog.collectAsState()
    val showCelestialDialog by viewModel.showCelestialDialog.collectAsState()
    val showAddEventDialog by viewModel.showAddEventDialog.collectAsState()
    val showNoteEditorDialog by viewModel.showNoteEditorDialog.collectAsState()
    val showRemarkSettingsDialog by viewModel.showRemarkSettingsDialog.collectAsState()
    val viewingNote by viewModel.viewingNote.collectAsState()
    val editingNote by viewModel.editingNote.collectAsState()

    val skyState = viewModel.getSkyState()
    val moonPhase = viewModel.getMoonPhase(selectedDate)

    Box(modifier = Modifier.fillMaxSize()) {
        // Celestial animated canvas background
        CelestialSkyBackground(
            skyState = skyState,
            moonPhase = moonPhase,
            modifier = Modifier.fillMaxSize()
        )

        // Subtle dark translucent overlay for content contrast
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF070B14).copy(alpha = 0.78f))
        )

        Scaffold(
            containerColor = Color.Transparent,
            bottomBar = {
                NavigationBar(
                    containerColor = Color(0xFF0C1322).copy(alpha = 0.95f),
                    tonalElevation = 8.dp,
                    modifier = Modifier.testTag("bottom_navigation_bar")
                ) {
                    NavigationBarItem(
                        selected = activeTab == 0,
                        onClick = { viewModel.setActiveTab(0) },
                        icon = {
                            Icon(
                                imageVector = Icons.Default.Assessment,
                                contentDescription = "Remark",
                                tint = if (activeTab == 0) StarGold else Color(0xFF94A3B8)
                            )
                        },
                        label = {
                            Text(
                                text = "Remark",
                                fontWeight = if (activeTab == 0) FontWeight.Bold else FontWeight.Normal,
                                fontSize = 12.sp
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedTextColor = StarGold,
                            unselectedTextColor = Color(0xFF94A3B8),
                            indicatorColor = StarGold.copy(alpha = 0.15f)
                        ),
                        modifier = Modifier.testTag("nav_item_remark")
                    )

                    NavigationBarItem(
                        selected = activeTab == 1,
                        onClick = { viewModel.setActiveTab(1) },
                        icon = {
                            Icon(
                                imageVector = Icons.Default.Home,
                                contentDescription = "Home",
                                tint = if (activeTab == 1) StarGold else Color(0xFF94A3B8)
                            )
                        },
                        label = {
                            Text(
                                text = "Home",
                                fontWeight = if (activeTab == 1) FontWeight.Bold else FontWeight.Normal,
                                fontSize = 12.sp
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedTextColor = StarGold,
                            unselectedTextColor = Color(0xFF94A3B8),
                            indicatorColor = StarGold.copy(alpha = 0.15f)
                        ),
                        modifier = Modifier.testTag("nav_item_home")
                    )

                    NavigationBarItem(
                        selected = activeTab == 2,
                        onClick = { viewModel.setActiveTab(2) },
                        icon = {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Note,
                                contentDescription = "Note",
                                tint = if (activeTab == 2) StarGold else Color(0xFF94A3B8)
                            )
                        },
                        label = {
                            Text(
                                text = "Note",
                                fontWeight = if (activeTab == 2) FontWeight.Bold else FontWeight.Normal,
                                fontSize = 12.sp
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedTextColor = StarGold,
                            unselectedTextColor = Color(0xFF94A3B8),
                            indicatorColor = StarGold.copy(alpha = 0.15f)
                        ),
                        modifier = Modifier.testTag("nav_item_note")
                    )
                }
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                when (activeTab) {
                    0 -> RemarkScreen(viewModel = viewModel)
                    1 -> HomeScreen(viewModel = viewModel)
                    2 -> NotesScreen(viewModel = viewModel)
                }
            }
        }

        // Dialog Overlays
        if (showCalendarDialog) {
            CalendarDialog(
                viewModel = viewModel,
                onDismiss = { viewModel.showCalendarDialog.value = false }
            )
        }

        if (showCelestialDialog) {
            CelestialDialog(
                viewModel = viewModel,
                onDismiss = { viewModel.showCelestialDialog.value = false }
            )
        }

        if (showAddEventDialog) {
            AddEventDialog(
                viewModel = viewModel,
                onDismiss = { viewModel.showAddEventDialog.value = false }
            )
        }

        if (showNoteEditorDialog) {
            NoteEditorDialog(
                viewModel = viewModel,
                noteToEdit = editingNote,
                onDismiss = {
                    viewModel.showNoteEditorDialog.value = false
                    viewModel.editingNote.value = null
                }
            )
        }

        if (viewingNote != null) {
            NoteViewerDialog(
                note = viewingNote!!,
                onEdit = {
                    val note = viewingNote!!
                    viewModel.viewingNote.value = null
                    viewModel.editingNote.value = note
                    viewModel.showNoteEditorDialog.value = true
                },
                onDelete = {
                    viewModel.deleteNote(viewingNote!!.id)
                },
                onDismiss = {
                    viewModel.viewingNote.value = null
                }
            )
        }

        if (showRemarkSettingsDialog) {
            RemarkSettingsDialog(
                viewModel = viewModel,
                onDismiss = { viewModel.showRemarkSettingsDialog.value = false }
            )
        }
    }
}
