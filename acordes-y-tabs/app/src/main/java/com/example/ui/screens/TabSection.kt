package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.SectionParser
import com.example.data.TabData

private val STRINGS = listOf("e", "B", "G", "D", "A", "E")
private val FRET_NUMBERS = listOf(0, 1, 2, 3, 4, 5, 7, 9, 10, 12, 14, 15)
private val TECHNIQUES = listOf(
    TechSymbol("h", "h", "Hammer-on"),
    TechSymbol("p", "p", "Pull-off"),
    TechSymbol("b", "b", "Bend"),
    TechSymbol("/", "/", "Slide ↑"),
    TechSymbol("\\", "\\", "Slide ↓"),
    TechSymbol("x", "x", "Mute")
)

data class TechSymbol(val symbol: String, val label: String, val desc: String)
data class SelectedCell(val s: Int, val c: Int)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TabSection(
    content: String,
    onChange: (String) -> Unit
) {
    val tabData = remember(content) { SectionParser.parseTab(content) }
    val tabMatrix = tabData.tab
    val repeat = tabData.repeat
    val columns = if (tabMatrix.isNotEmpty()) tabMatrix[0].size else 16

    val chordsList = remember(tabData, columns) {
        if (tabData.chords.size == columns) tabData.chords else List(columns) { "" }
    }

    var selectedCell by remember { mutableStateOf<SelectedCell?>(null) }
    var inputValue by remember { mutableStateOf("") }
    val horizontalScrollState = rememberScrollState()

    // Fast styles definition
    val baseStyle = MaterialTheme.typography.bodyLarge
    val cellEmptyStyle = remember(baseStyle) {
        baseStyle.copy(
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Normal,
            fontSize = 14.sp
        )
    }
    val cellFilledStyle = remember(baseStyle) {
        baseStyle.copy(
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp
        )
    }
    val pipeStyle = remember(baseStyle) {
        baseStyle.copy(fontFamily = FontFamily.Monospace)
    }
    
    val labelBaseStyle = MaterialTheme.typography.labelLarge
    val stringLabelStyle = remember(labelBaseStyle) {
        labelBaseStyle.copy(
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
            fontSize = 15.sp
        )
    }

    val selectedColor = MaterialTheme.colorScheme.primary
    val selectedTextColor = MaterialTheme.colorScheme.onPrimary
    val unselectedTextColor = MaterialTheme.colorScheme.onBackground
    val emptyTextColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.35f)

    fun save(matrix: List<List<String>>, loopsNum: Int, chords: List<String>) {
        val next = TabData(tab = matrix, repeat = loopsNum, chords = chords)
        onChange(SectionParser.serializeTab(next))
    }

    fun addColumns() {
        val nextMatrix = tabMatrix.map { row -> row + List(8) { "-" } }
        val nextChords = chordsList + List(8) { "" }
        save(nextMatrix, repeat, nextChords)
    }

    fun removeColumns() {
        if (columns <= 8) return
        val nextMatrix = tabMatrix.map { row -> row.take(columns - 8) }
        val nextChords = chordsList.take(columns - 8)
        save(nextMatrix, repeat, nextChords)
    }

    fun handleCellTap(si: Int, ci: Int) {
        selectedCell = SelectedCell(si, ci)
        val currentVal = tabMatrix.getOrNull(si)?.getOrNull(ci) ?: "-"
        inputValue = if (currentVal == "-") "" else currentVal
    }

    fun handleChordTap(ci: Int) {
        selectedCell = SelectedCell(-1, ci)
        val currentVal = chordsList.getOrNull(ci) ?: ""
        inputValue = currentVal
    }

    fun commitValue(newValue: String) {
        val cell = selectedCell ?: return
        if (cell.s == -1) {
            val nextChords = chordsList.mapIndexed { ci, colVal ->
                if (ci == cell.c) newValue.trim() else colVal
            }
            save(tabMatrix, repeat, nextChords)
        } else {
            val cleanValue = newValue.trim().ifEmpty { "-" }
            val nextMatrix = tabMatrix.mapIndexed { si, row ->
                row.mapIndexed { ci, colVal ->
                    if (si == cell.s && ci == cell.c) cleanValue else colVal
                }
            }
            save(nextMatrix, repeat, chordsList)
        }
        selectedCell = null
        inputValue = ""
    }

    fun tapFret(num: Int) {
        val endsWithTech = TECHNIQUES.any { inputValue.endsWith(it.symbol) }
        inputValue = if (endsWithTech) inputValue + num else num.toString()
    }

    fun tapTechnique(symbol: String) {
        if (inputValue.isEmpty() || inputValue == "-") return
        inputValue += symbol
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.3f))
            .padding(16.dp)
    ) {
        // Tab Layout Display (Horizontal Scrollable)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(horizontalScrollState)
        ) {
            Column {
                Row(
                    modifier = Modifier.height(36.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Aco.",
                        style = stringLabelStyle,
                        color = MaterialTheme.colorScheme.primary,
                        textAlign = TextAlign.End,
                        modifier = Modifier.width(22.dp)
                    )

                    Spacer(modifier = Modifier.width(6.dp))

                    Text(
                        text = " ",
                        style = pipeStyle,
                        color = Color.Transparent
                    )

                    chordsList.forEachIndexed { ci, valStr ->
                        val isSelected = selectedCell?.s == -1 && selectedCell?.c == ci
                        ChordCell(
                            valStr = valStr,
                            isSelected = isSelected,
                            onClick = { handleChordTap(ci) },
                            textStyle = cellFilledStyle.copy(fontSize = 12.sp),
                            selectedColor = selectedColor,
                            selectedTextColor = selectedTextColor,
                            unselectedTextColor = selectedColor,
                            emptyTextColor = emptyTextColor
                        )
                    }

                    Text(
                        text = " ",
                        style = pipeStyle,
                        color = Color.Transparent
                    )
                }

                STRINGS.forEachIndexed { si, strName ->
                    Row(
                        modifier = Modifier.height(36.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // String name
                        Text(
                            text = strName,
                            style = stringLabelStyle,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f),
                            textAlign = TextAlign.End,
                            modifier = Modifier.width(22.dp)
                        )

                        Spacer(modifier = Modifier.width(6.dp))

                        Text(
                            text = "|",
                            style = pipeStyle,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                        )

                        // Render each column cell
                        if (tabMatrix.size > si) {
                            tabMatrix[si].forEachIndexed { ci, valStr ->
                                val isSelected = selectedCell?.s == si && selectedCell?.c == ci
                                TabCell(
                                    valStr = valStr,
                                    isSelected = isSelected,
                                    onClick = { handleCellTap(si, ci) },
                                    emptyStyle = cellEmptyStyle,
                                    filledStyle = cellFilledStyle,
                                    selectedColor = selectedColor,
                                    selectedTextColor = selectedTextColor,
                                    unselectedTextColor = unselectedTextColor,
                                    emptyTextColor = emptyTextColor
                                )
                            }
                        }

                        Text(
                            text = "|",
                            style = pipeStyle,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                        )

                        // If repeat is active and this is the last row, draw a small indicator
                        if (repeat > 1 && si == STRINGS.size - 1) {
                            Text(
                                text = " ×$repeat",
                                style = pipeStyle,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                                modifier = Modifier.padding(start = 6.dp)
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Input Editor Drawer Panel (Expanded when selected)
        AnimatedVisibility(visible = selectedCell != null) {
            selectedCell?.let { cell ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(MaterialTheme.colorScheme.secondary.copy(alpha = 0.3f))
                        .padding(12.dp)
                ) {
                    // Header Status area
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Position text
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(MaterialTheme.colorScheme.surface)
                                .padding(horizontal = 10.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = if (cell.s == -1) "Aco:${cell.c + 1}" else "${STRINGS.getOrNull(cell.s) ?: ""}:${cell.c + 1}",
                                style = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        // Display box of writing value
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(MaterialTheme.colorScheme.surface)
                                .padding(horizontal = 12.dp, vertical = 6.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = inputValue.ifEmpty { "—" },
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 18.sp
                                ),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        // Cleans cell to "-" or ""
                        TextButton(
                            onClick = { commitValue(if (cell.s == -1) "" else "-") }
                        ) {
                            Text("Limpiar", color = Color.Red.copy(alpha = 0.8f))
                        }

                        Button(
                            onClick = { commitValue(inputValue) },
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary,
                                contentColor = MaterialTheme.colorScheme.onPrimary
                            ),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text("OK", style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold))
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (cell.s == -1) {
                        // Custom chord textbox input and quick pop presets
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedTextField(
                                    value = inputValue,
                                    onValueChange = { inputValue = it },
                                    placeholder = { Text("Ej: C, Cadd9, G/B, Am7...", style = MaterialTheme.typography.bodyMedium) },
                                    textStyle = MaterialTheme.typography.bodyMedium,
                                    shape = RoundedCornerShape(10.dp),
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                                        unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                                        focusedContainerColor = MaterialTheme.colorScheme.surface,
                                        unfocusedContainerColor = MaterialTheme.colorScheme.surface
                                    ),
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Text(
                                text = "Acordes típicos:",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f),
                                modifier = Modifier.padding(bottom = 6.dp)
                            )

                            FlowRow(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                listOf("C", "Cadd9", "Cmaj7", "G", "G/B", "D", "Dsus4", "Am", "Am7", "Em", "Em7", "F", "Fmaj7", "A", "Bm", "C/E", "D/F#").forEach { chordPreset ->
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(MaterialTheme.colorScheme.surface)
                                            .clickable { inputValue = chordPreset },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = chordPreset,
                                            style = MaterialTheme.typography.bodySmall.copy(
                                                fontWeight = FontWeight.Bold,
                                                fontFamily = FontFamily.Serif
                                            ),
                                            color = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        // Fret Numbers panel
                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            FRET_NUMBERS.forEach { num ->
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(MaterialTheme.colorScheme.surface)
                                        .clickable { tapFret(num) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = num.toString(),
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            fontFamily = FontFamily.Monospace,
                                            fontWeight = FontWeight.Bold
                                        ),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Tech symbols panel
                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            TECHNIQUES.forEach { tech ->
                                Row(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(MaterialTheme.colorScheme.surface)
                                        .clickable { tapTechnique(tech.symbol) }
                                        .padding(horizontal = 8.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = tech.label,
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            fontFamily = FontFamily.Monospace,
                                            fontWeight = FontWeight.Bold
                                        ),
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = tech.desc,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Column and Repeat modifier controls
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Columns size
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                IconButton(
                    onClick = { removeColumns() },
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(MaterialTheme.colorScheme.secondary.copy(alpha = 0.4f))
                ) {
                    Icon(Icons.Default.Remove, "menos columnas", modifier = Modifier.size(16.dp))
                }

                IconButton(
                    onClick = { addColumns() },
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(MaterialTheme.colorScheme.secondary.copy(alpha = 0.4f))
                ) {
                    Icon(Icons.Default.Add, "más columnas", modifier = Modifier.size(16.dp))
                }

                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "$columns cols",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Loop Repeat control
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "Repetir:",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(end = 4.dp)
                )

                IconButton(
                    onClick = { save(tabMatrix, maxOf(1, repeat - 1), chordsList) },
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(MaterialTheme.colorScheme.secondary.copy(alpha = 0.4f))
                ) {
                    Icon(Icons.Default.Remove, "menos repetición", modifier = Modifier.size(16.dp))
                }

                Text(
                    text = repeat.toString(),
                    style = MaterialTheme.typography.titleMedium.copy(fontFamily = FontFamily.Monospace),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.width(28.dp)
                )

                IconButton(
                    onClick = { save(tabMatrix, repeat + 1, chordsList) },
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(MaterialTheme.colorScheme.secondary.copy(alpha = 0.4f))
                ) {
                    Icon(Icons.Default.Add, "más repetición", modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}

@Composable
private fun ChordCell(
    valStr: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    textStyle: TextStyle,
    selectedColor: Color,
    selectedTextColor: Color,
    unselectedTextColor: Color,
    emptyTextColor: Color
) {
    val isEmpty = valStr.isEmpty()
    Box(
        modifier = Modifier
            .size(24.dp)
            .padding(horizontal = 1.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(if (isSelected) selectedColor else if (!isEmpty) selectedColor.copy(alpha = 0.15f) else Color.Transparent)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = if (isEmpty) "·" else valStr,
            style = textStyle,
            color = when {
                isSelected -> selectedTextColor
                !isEmpty -> unselectedTextColor
                else -> emptyTextColor
            }
        )
    }
}

@Composable
private fun TabCell(
    valStr: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    emptyStyle: TextStyle,
    filledStyle: TextStyle,
    selectedColor: Color,
    selectedTextColor: Color,
    unselectedTextColor: Color,
    emptyTextColor: Color
) {
    val isEmpty = valStr == "-"
    Box(
        modifier = Modifier
            .size(24.dp)
            .padding(horizontal = 1.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(if (isSelected) selectedColor else Color.Transparent)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = valStr,
            style = if (isEmpty) emptyStyle else filledStyle,
            color = when {
                isSelected -> selectedTextColor
                !isEmpty -> unselectedTextColor
                else -> emptyTextColor
            }
        )
    }
}
