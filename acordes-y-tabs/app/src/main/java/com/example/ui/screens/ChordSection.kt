package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.ChordItem
import com.example.data.ChordLine
import com.example.data.SectionParser

val COMMON_CHORDS = listOf(
    "C", "Cadd9", "Cmaj7", "Cm", "C/E",
    "G", "G6", "Gmaj7", "Gm", "G/B",
    "D", "Dsus4", "Dsus2", "Dm", "D7", "D/F#",
    "A", "Asus4", "Amaj7", "Am", "Am7",
    "E", "Esus4", "E7", "Em", "Em7",
    "F", "Fmaj7", "Fadd9", "Fm",
    "B", "Bm", "Bm7", "B7"
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ChordSection(
    content: String,
    onChange: (String) -> Unit
) {
    val lines = remember(content) { SectionParser.parseChords(content).toMutableList() }
    var activeLineIdx by remember { mutableStateOf<Int?>(null) }
    var showPicker by remember { mutableStateOf(false) }
    var customChordText by remember { mutableStateOf("") }

    // Style cache for high performance layout rendering
    val labelSmallStyle = MaterialTheme.typography.labelSmall
    val displayBeatStyle = remember(labelSmallStyle) {
        labelSmallStyle.copy(
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Normal,
            fontSize = 11.sp
        )
    }
    val controlBeatStyle = remember(labelSmallStyle) {
        labelSmallStyle.copy(
            fontFamily = FontFamily.Monospace
        )
    }

    val titleMediumStyle = MaterialTheme.typography.titleMedium
    val displayChordStyle = remember(titleMediumStyle) {
        titleMediumStyle.copy(
            fontFamily = FontFamily.Serif,
            fontSize = 28.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
    val controlChordStyle = remember(titleMediumStyle) {
        titleMediumStyle.copy(
            fontFamily = FontFamily.Serif
        )
    }

    val bodyMediumStyle = MaterialTheme.typography.bodyMedium
    val repeatLabelStyle = remember(bodyMediumStyle) {
        bodyMediumStyle.copy(
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Medium
        )
    }

    fun save(newLines: List<ChordLine>) {
        onChange(SectionParser.serializeChords(newLines))
    }

    fun addChordToActive(chordName: String) {
        val lineIndex = activeLineIdx ?: if (lines.isNotEmpty()) lines.size - 1 else null
        if (lines.isEmpty() || lineIndex == null || lineIndex < 0) {
            val freshLines = listOf(ChordLine(chords = listOf(ChordItem(chordName, 1)), repeat = 1))
            save(freshLines)
            activeLineIdx = 0
        } else {
            val updated = lines.mapIndexed { idx, line ->
                if (idx == lineIndex) {
                    line.copy(chords = line.chords + ChordItem(chordName, 1))
                } else {
                    line
                }
            }
            save(updated)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.3f))
            .padding(16.dp)
    ) {
        // Render lines
        if (lines.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 32.dp, horizontal = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.MusicNote,
                        contentDescription = "Sin acordes",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f),
                        modifier = Modifier.size(36.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Sección vacía",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                    )
                }
            }
        } else {
            lines.forEachIndexed { li, line ->
                val isActive = activeLineIdx == li && showPicker
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            if (isActive) MaterialTheme.colorScheme.secondary.copy(alpha = 0.6f)
                            else Color.Transparent
                        )
                        .clickable {
                            activeLineIdx = li
                            showPicker = true
                        }
                        .padding(12.dp)
                ) {
                    // Chords list flow row
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Start,
                        verticalArrangement = Arrangement.Bottom,
                        maxItemsInEachRow = 12
                    ) {
                        line.chords.forEach { item ->
                            ChordItemView(
                                item = item,
                                beatStyle = displayBeatStyle,
                                chordStyle = displayChordStyle
                            )
                        }

                        if (line.repeat > 1) {
                            Text(
                                text = " ] ×${line.repeat}",
                                style = repeatLabelStyle,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                                modifier = Modifier.padding(bottom = 4.dp, start = 4.dp)
                            )
                        }
                    }
                }
            }
        }

        // Active Line Controls
        if (lines.isNotEmpty() && activeLineIdx != null && activeLineIdx!! < lines.size) {
            val li = activeLineIdx!!
            val line = lines[li]

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(MaterialTheme.colorScheme.secondary.copy(alpha = 0.3f))
                    .padding(12.dp)
            ) {
                // Chord modifications
                Text(
                    text = "Ajustes de acordes:",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 8.dp, start = 4.dp)
                )

                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Start,
                    verticalArrangement = Arrangement.Center
                ) {
                    line.chords.forEachIndexed { ci, item ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .padding(end = 8.dp, bottom = 8.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(MaterialTheme.colorScheme.surface)
                                .padding(horizontal = 6.dp, vertical = 4.dp)
                        ) {
                            // Decrement beats
                            IconButton(
                                onClick = {
                                    val updated = lines.mapIndexed { lidx, l ->
                                        if (lidx == li) {
                                            val newChords = l.chords.mapIndexed { cidx, c ->
                                                if (cidx == ci) c.copy(beats = maxOf(1, c.beats - 1)) else c
                                            }
                                            l.copy(chords = newChords)
                                        } else l
                                    }
                                    save(updated)
                                },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(Icons.Default.Remove, "menos", modifier = Modifier.size(14.dp))
                            }

                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .padding(horizontal = 4.dp)
                                    .widthIn(min = 28.dp)
                            ) {
                                Text(
                                    text = "${item.beats}×",
                                    style = controlBeatStyle,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = item.name,
                                    style = controlChordStyle,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }

                            // Increment beats
                            IconButton(
                                onClick = {
                                    val updated = lines.mapIndexed { lidx, l ->
                                        if (lidx == li) {
                                            val newChords = l.chords.mapIndexed { cidx, c ->
                                                if (cidx == ci) c.copy(beats = c.beats + 1) else c
                                            }
                                            l.copy(chords = newChords)
                                        } else l
                                    }
                                    save(updated)
                                },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(Icons.Default.Add, "más", modifier = Modifier.size(14.dp))
                            }

                            // Delete chord
                            IconButton(
                                onClick = {
                                    val updated = lines.mapIndexed { lidx, l ->
                                        if (lidx == li) {
                                            val filteredChords = l.chords.filterIndexed { cidx, _ -> cidx != ci }
                                            l.copy(chords = filteredChords)
                                        } else l
                                    }.filter { it.chords.isNotEmpty() }

                                    save(updated)
                                    if (updated.isEmpty()) {
                                        activeLineIdx = null
                                    } else if (li >= updated.size) {
                                        activeLineIdx = updated.size - 1
                                    }
                                },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "eliminar",
                                    tint = Color.Red.copy(alpha = 0.8f),
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Repeat modifications
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Repetir línea:",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.End
                    ) {
                        IconButton(
                            onClick = {
                                val updated = lines.mapIndexed { lidx, l ->
                                    if (lidx == li) l.copy(repeat = maxOf(1, l.repeat - 1)) else l
                                }
                                save(updated)
                            },
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(MaterialTheme.colorScheme.surface)
                        ) {
                            Icon(Icons.Default.Remove, "menos repetir", modifier = Modifier.size(16.dp))
                        }

                        Text(
                            text = line.repeat.toString(),
                            style = MaterialTheme.typography.titleMedium.copy(fontFamily = FontFamily.Monospace),
                            textAlign = TextAlign.Center,
                            modifier = Modifier.width(36.dp)
                        )

                        IconButton(
                            onClick = {
                                val updated = lines.mapIndexed { lidx, l ->
                                    if (lidx == li) l.copy(repeat = l.repeat + 1) else l
                                }
                                save(updated)
                            },
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(MaterialTheme.colorScheme.surface)
                        ) {
                            Icon(Icons.Default.Add, "más repetir", modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Buttons for Acorde & Nueva línea
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Button(
                onClick = {
                    showPicker = !showPicker
                    if (showPicker && lines.isEmpty()) {
                        // Create layout line
                        val nextLines = lines + ChordLine(chords = emptyList(), repeat = 1)
                        save(nextLines)
                        activeLineIdx = nextLines.size - 1
                    } else if (showPicker && activeLineIdx == null) {
                        activeLineIdx = lines.size - 1
                    }
                },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.secondary,
                    contentColor = MaterialTheme.colorScheme.onSecondary
                ),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("+ Acorde", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium))
            }

            Button(
                onClick = {
                    val nextLines = lines + ChordLine(chords = emptyList(), repeat = 1)
                    save(nextLines)
                    activeLineIdx = nextLines.size - 1
                    showPicker = true
                },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.secondary,
                    contentColor = MaterialTheme.colorScheme.onSecondary
                ),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Nueva línea", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium))
            }
        }

        // Chord Picker grid
        AnimatedVisibility(visible = showPicker) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp)
            ) {
                // Custom chord input
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = customChordText,
                        onValueChange = { customChordText = it },
                        placeholder = { Text("Ej: Cadd9, F#m...", style = MaterialTheme.typography.bodyMedium) },
                        textStyle = MaterialTheme.typography.bodyMedium,
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = {
                            val chunk = customChordText.trim()
                            if (chunk.isNotBlank()) {
                                addChordToActive(chunk)
                                customChordText = ""
                            }
                        }),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MaterialTheme.colorScheme.primary,
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline
                        ),
                        modifier = Modifier.weight(1f)
                    )

                    Button(
                        onClick = {
                            val chunk = customChordText.trim()
                            if (chunk.isNotBlank()) {
                                addChordToActive(chunk)
                                customChordText = ""
                            }
                        },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.onPrimary
                        ),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)
                    ) {
                        Text("OK", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Preset common chords grid
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    COMMON_CHORDS.forEach { chord ->
                        Button(
                            onClick = { addChordToActive(chord) },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.secondary.copy(alpha = 0.5f),
                                contentColor = MaterialTheme.colorScheme.onBackground
                            ),
                            elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = chord,
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontFamily = FontFamily.Serif,
                                    fontSize = 17.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ChordItemView(
    item: ChordItem,
    beatStyle: TextStyle,
    chordStyle: TextStyle
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(end = 16.dp, bottom = 4.dp)
    ) {
        if (item.beats > 1) {
            Text(
                text = item.beats.toString(),
                style = beatStyle,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.60f),
                modifier = Modifier.padding(bottom = 1.dp)
            )
        } else {
            Spacer(modifier = Modifier.height(14.dp))
        }
        Text(
            text = item.name,
            style = chordStyle,
            color = MaterialTheme.colorScheme.onBackground
        )
    }
}
