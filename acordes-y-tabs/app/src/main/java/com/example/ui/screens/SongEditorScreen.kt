package com.example.ui.screens

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.Section
import com.example.data.SongEntity
import com.example.data.TabData
import com.example.data.SectionParser
import com.example.viewmodel.SongViewModel
import com.squareup.moshi.Moshi
import com.squareup.moshi.Types
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory

data class SectionPreset(val name: String, val emoji: String)

private val SECTION_PRESETS = listOf(
    SectionPreset("Intro", "🎸"),
    SectionPreset("Verso", "📖"),
    SectionPreset("Coro", "🎵"),
    SectionPreset("Puente", "🌉"),
    SectionPreset("Outro", "🎶"),
    SectionPreset("Solo", "⚡"),
    SectionPreset("Pre-coro", "🔄"),
    SectionPreset("Riff", "🎸")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SongEditorScreen(
    viewModel: SongViewModel,
    songId: Long,
    onNavigateBack: () -> Unit
) {
    val song by viewModel.currentSong.collectAsState()
    val isSaving by viewModel.isSaving.collectAsState()
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showAddSectionSheet by remember { mutableStateOf(false) }
    val context = LocalContext.current

    // Load song details once on start
    LaunchedEffect(songId) {
        viewModel.loadSong(songId)
    }

    // Helper Moshi serializer
    val listType = remember { Types.newParameterizedType(List::class.java, Section::class.java) }
    val moshi = remember { Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build() }
    val adapter = remember { moshi.adapter<List<Section>>(listType) }

    fun getSections(entityValue: SongEntity?): List<Section> {
        val json = entityValue?.sectionsJson ?: "[]"
        return try {
            adapter.fromJson(json) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun saveSections(entityValue: SongEntity?, list: List<Section>) {
        val json = try {
            adapter.toJson(list)
        } catch (e: Exception) {
            "[]"
        }
        viewModel.updateCurrentSongFields(sectionsJson = json)
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding(),
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Volver",
                            tint = MaterialTheme.colorScheme.onBackground
                        )
                    }
                },
                actions = {
                    if (isSaving) {
                        Text(
                            text = "guardando...",
                            style = MaterialTheme.typography.bodySmall.copy(
                                fontWeight = FontWeight.Normal,
                                fontFamily = FontFamily.SansSerif
                            ),
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                            modifier = Modifier.padding(end = 8.dp)
                        )
                    }

                    var showMenu by remember { mutableStateOf(false) }
                    IconButton(onClick = { showMenu = true }) {
                        Icon(
                            imageVector = Icons.Default.MoreVert,
                            contentDescription = "Opciones",
                            tint = MaterialTheme.colorScheme.onBackground
                        )
                    }

                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Eliminar canción", color = Color.Red.copy(alpha = 0.8f)) },
                            leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = Color.Red.copy(alpha = 0.8f)) },
                            onClick = {
                                showMenu = false
                                showDeleteDialog = true
                            }
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        song?.let { activeSong ->
            val sectionsList = remember(activeSong.sectionsJson) { getSections(activeSong) }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentPadding = PaddingValues(bottom = 120.dp)
            ) {
                // Title and Artist edits
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp)
                    ) {
                        // Title Input
                        TextField(
                            value = activeSong.title,
                            onValueChange = { viewModel.updateCurrentSongFields(title = it) },
                            placeholder = {
                                Text(
                                    "Título",
                                    style = MaterialTheme.typography.displayMedium.copy(
                                        fontFamily = FontFamily.Serif,
                                        fontWeight = FontWeight.Light,
                                        fontSize = 38.sp
                                    ),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                                )
                            },
                            textStyle = MaterialTheme.typography.displayMedium.copy(
                                fontFamily = FontFamily.Serif,
                                fontWeight = FontWeight.Light,
                                fontSize = 38.sp
                            ),
                            colors = TextFieldDefaults.colors(
                                focusedContainerColor = Color.Transparent,
                                unfocusedContainerColor = Color.Transparent,
                                disabledContainerColor = Color.Transparent,
                                focusedIndicatorColor = Color.Transparent,
                                unfocusedIndicatorColor = Color.Transparent
                            ),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        // Artist Input
                        TextField(
                            value = activeSong.artist,
                            onValueChange = { viewModel.updateCurrentSongFields(artist = it) },
                            placeholder = {
                                Text(
                                    "Artista",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                                )
                            },
                            textStyle = MaterialTheme.typography.bodyMedium,
                            colors = TextFieldDefaults.colors(
                                focusedContainerColor = Color.Transparent,
                                unfocusedContainerColor = Color.Transparent,
                                disabledContainerColor = Color.Transparent,
                                focusedIndicatorColor = Color.Transparent,
                                unfocusedIndicatorColor = Color.Transparent
                            ),
                            singleLine = true,
                            modifier = Modifier
                                .fillMaxWidth()
                                .offset(y = (-8).dp)
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Capo and Tuning controls
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Capo Stepper
                            Row(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                                    .padding(horizontal = 4.dp, vertical = 2.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                IconButton(
                                    onClick = {
                                        val nextCapo = maxOf(0, activeSong.capo - 1)
                                        viewModel.updateCurrentSongFields(capo = nextCapo)
                                    },
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Remove,
                                        contentDescription = "Bajar capo",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }

                                Text(
                                    text = if (activeSong.capo == 0) "Sin Capo" else "Capo: Traste ${activeSong.capo}",
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                                    color = MaterialTheme.colorScheme.onSurface,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.weight(1f)
                                )

                                IconButton(
                                    onClick = {
                                        val nextCapo = minOf(12, activeSong.capo + 1)
                                        viewModel.updateCurrentSongFields(capo = nextCapo)
                                    },
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Add,
                                        contentDescription = "Subir capo",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }

                            // Tuning Dropdown
                            var showTuningMenu by remember { mutableStateOf(false) }
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                                    .clickable { showTuningMenu = true }
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                contentAlignment = Alignment.CenterStart
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = if (activeSong.tuning.isEmpty()) "Estándar" else activeSong.tuning,
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                                        color = MaterialTheme.colorScheme.onSurface,
                                        maxLines = 1
                                    )
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = "Elegir afinación",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }

                                DropdownMenu(
                                    expanded = showTuningMenu,
                                    onDismissRequest = { showTuningMenu = false }
                                ) {
                                    val tunings = listOf("Estándar", "Drop D", "Eb Estándar", "DADGAD", "Open G", "Open D")
                                    tunings.forEach { tuningOpt ->
                                        DropdownMenuItem(
                                            text = { Text(tuningOpt) },
                                            onClick = {
                                                viewModel.updateCurrentSongFields(tuning = tuningOpt)
                                                showTuningMenu = false
                                            }
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }

                // Render active sections
                itemsIndexed(sectionsList) { idx, section ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp, vertical = 8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = section.name.uppercase(),
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.25.sp
                                ),
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.70f)
                            )

                            var showSectionMenu by remember { mutableStateOf(false) }
                            IconButton(
                                onClick = { showSectionMenu = true },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.MoreHoriz,
                                    contentDescription = "Sección opciones",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            DropdownMenu(
                                expanded = showSectionMenu,
                                onDismissRequest = { showSectionMenu = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Duplicar") },
                                    leadingIcon = { Icon(Icons.Default.ContentCopy, contentDescription = null) },
                                    onClick = {
                                        showSectionMenu = false
                                        val cloned = section.copy(name = "${section.name} (copia)")
                                        val next = sectionsList.toMutableList()
                                        next.add(idx + 1, cloned)
                                        saveSections(activeSong, next)
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Eliminar", color = Color.Red.copy(alpha = 0.8f)) },
                                    leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = Color.Red.copy(alpha = 0.8f)) },
                                    onClick = {
                                        showSectionMenu = false
                                        val next = sectionsList.toMutableList()
                                        next.removeAt(idx)
                                        saveSections(activeSong, next)
                                    }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        if (section.type == "chords") {
                            ChordSection(
                                content = section.content,
                                onChange = { rawChords ->
                                    val next = sectionsList.mapIndexed { sidx, item ->
                                        if (sidx == idx) item.copy(content = rawChords) else item
                                    }
                                    saveSections(activeSong, next)
                                }
                            )
                        } else {
                            TabSection(
                                content = section.content,
                                onChange = { rawTab ->
                                    val next = sectionsList.mapIndexed { sidx, item ->
                                        if (sidx == idx) item.copy(content = rawTab) else item
                                    }
                                    saveSections(activeSong, next)
                                }
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }

                // Add section dashed card element
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp, vertical = 16.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .clickable { showAddSectionSheet = true }
                            .border(
                                1.5.dp,
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                                RoundedCornerShape(16.dp)
                            )
                            .padding(vertical = 20.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Añadir sección",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                            )
                        }
                    }
                }
            }

    // Add Section Dialog Custom Bottom Sheet Style
    if (showAddSectionSheet) {
        var addStep by remember { mutableStateOf("name") } // "name" | "type"
        var selectedName by remember { mutableStateOf("") }
        var customNameText by remember { mutableStateOf("") }

        Dialog(
            onDismissRequest = { showAddSectionSheet = false },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clickable { showAddSectionSheet = false },
                contentAlignment = Alignment.BottomCenter
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .fillMaxHeight(0.55f)
                        .clip(RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))
                        .clickable(enabled = false) {}, // prevent click-through closures
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp)
                    ) {
                        // Slider handle decoration
                        Box(
                            modifier = Modifier
                                .size(40.dp, 4.dp)
                                .clip(RoundedCornerShape(2.dp))
                                .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                                .align(Alignment.CenterHorizontally)
                        )

                        Spacer(modifier = Modifier.height(18.dp))

                        if (addStep == "name") {
                            Text(
                                text = "¿Qué sección?",
                                style = MaterialTheme.typography.titleLarge,
                                fontFamily = FontFamily.Serif,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(16.dp))

                            // Grid of preset buttons
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        SECTION_PRESETS.take(4).forEach { preset ->
                                            SectionPresetBtn(preset) {
                                                selectedName = preset.name
                                                addStep = "type"
                                            }
                                        }
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        SECTION_PRESETS.drop(4).forEach { preset ->
                                            SectionPresetBtn(preset) {
                                                selectedName = preset.name
                                                addStep = "type"
                                            }
                                        }
                                    }
                                }
                            }

                            // Custom input
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 12.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                OutlinedTextField(
                                    value = customNameText,
                                    onValueChange = { customNameText = it },
                                    placeholder = { Text("Nombre personalizado...") },
                                    shape = RoundedCornerShape(12.dp),
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                                        unfocusedBorderColor = MaterialTheme.colorScheme.outline
                                    ),
                                    modifier = Modifier.weight(1f)
                                )

                                Button(
                                    onClick = {
                                        val chunk = customNameText.trim()
                                        if (chunk.isNotBlank()) {
                                            selectedName = chunk
                                            addStep = "type"
                                        }
                                    },
                                    enabled = customNameText.trim().isNotEmpty(),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("OK", color = MaterialTheme.colorScheme.onPrimary)
                                }
                            }
                        } else {
                            // Step choosing types
                            TextButton(
                                onClick = { addStep = "name" },
                                contentPadding = PaddingValues(0.dp),
                                modifier = Modifier.offset(x = (-8).dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.ArrowBack, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Volver", style = MaterialTheme.typography.bodySmall)
                                }
                            }

                            Text(
                                text = selectedName,
                                style = MaterialTheme.typography.titleLarge,
                                fontFamily = FontFamily.Serif,
                                color = MaterialTheme.colorScheme.onSurface
                            )

                            Text(
                                text = "¿Qué tipo de contenido tiene esta sección?",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Spacer(modifier = Modifier.height(28.dp))

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .weight(1f),
                                horizontalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                // Chords type
                                Card(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight(0.85f)
                                        .clip(RoundedCornerShape(16.dp))
                                        .clickable {
                                            val nextList = sectionsList + Section(
                                                name = selectedName,
                                                type = "chords",
                                                content = "[]"
                                            )
                                            saveSections(activeSong, nextList)
                                            showAddSectionSheet = false
                                        },
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary.copy(alpha = 0.5f))
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .padding(16.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.MusicNote,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(36.dp)
                                        )
                                        Spacer(modifier = Modifier.height(12.dp))
                                        Text(
                                            "Acordes",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            "Progresión de acordes con pulsos",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                                            textAlign = TextAlign.Center
                                        )
                                    }
                                }

                                // Tab type
                                Card(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight(0.85f)
                                        .clip(RoundedCornerShape(16.dp))
                                        .clickable {
                                            val emptyTab = SectionParser.createEmptyTab()
                                            val rawEmptyTab = SectionParser.serializeTab(TabData(tab = emptyTab, repeat = 1))
                                            val nextList = sectionsList + Section(
                                                name = selectedName,
                                                type = "tab",
                                                content = rawEmptyTab
                                            )
                                            saveSections(activeSong, nextList)
                                            showAddSectionSheet = false
                                        },
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary.copy(alpha = 0.5f))
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .padding(16.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Menu,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(36.dp)
                                        )
                                        Spacer(modifier = Modifier.height(12.dp))
                                        Text(
                                            "Tablatura",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            "Editor de 6 cuerdas con fretboard",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                                            textAlign = TextAlign.Center
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Delete confirmation dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = {
                Text(
                    "¿Eliminar canción?",
                    style = MaterialTheme.typography.titleLarge,
                    fontFamily = FontFamily.Serif
                )
            },
            text = {
                Text(
                    "Esta acción no se puede deshacer y borrará la canción localmente.",
                    style = MaterialTheme.typography.bodyMedium
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showDeleteDialog = false
                        viewModel.deleteSong(songId) {
                            Toast.makeText(context, "Canción eliminada", Toast.LENGTH_SHORT).show()
                            onNavigateBack()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Red.copy(alpha = 0.82f))
                ) {
                    Text("Eliminar", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancelar", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            },
            shape = RoundedCornerShape(20.dp)
        )
    }
        }
    }
}

@Composable
fun SectionPresetBtn(
    preset: SectionPreset,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary.copy(alpha = 0.4f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = preset.emoji, fontSize = 18.sp)
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = preset.name,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}
