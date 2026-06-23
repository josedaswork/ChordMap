package com.example.data

import com.squareup.moshi.Moshi
import com.squareup.moshi.Types
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory

// --- CHORD SYSTEM MODELS ---
data class ChordItem(
    val name: String,
    val beats: Int = 1
)

data class ChordLine(
    val chords: List<ChordItem> = emptyList(),
    val repeat: Int = 1
)

// --- TAB SYSTEM MODELS ---
data class TabData(
    val tab: List<List<String>> = emptyList(),
    val repeat: Int = 1,
    val chords: List<String> = emptyList()
)

// Helper to parse sections easily
object SectionParser {
    private val moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()

    // Chore lines parsing
    private val chordLineListType = Types.newParameterizedType(List::class.java, ChordLine::class.java)
    private val chordLineAdapter = moshi.adapter<List<ChordLine>>(chordLineListType)

    // Tab details parsing
    private val tabDataAdapter = moshi.adapter(TabData::class.java)

    fun parseChords(content: String): List<ChordLine> {
        if (content.isEmpty() || content == "[]") return emptyList()
        return try {
            chordLineAdapter.fromJson(content) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun serializeChords(lines: List<ChordLine>): String {
        return try {
            chordLineAdapter.toJson(lines)
        } catch (e: Exception) {
            "[]"
        }
    }

    fun parseTab(content: String): TabData {
        if (content.isEmpty() || content == "{}") return TabData(tab = createEmptyTab(), repeat = 1)
        return try {
            tabDataAdapter.fromJson(content) ?: TabData(tab = createEmptyTab(), repeat = 1)
        } catch (e: Exception) {
            TabData(tab = createEmptyTab(), repeat = 1)
        }
    }

    fun serializeTab(tabData: TabData): String {
        return try {
            tabDataAdapter.toJson(tabData)
        } catch (e: Exception) {
            "{}"
        }
    }

    fun createEmptyTab(columns: Int = 16): List<List<String>> {
        // 6 rows (e, B, G, D, A, E)
        return List(6) { List(columns) { "-" } }
    }
}
