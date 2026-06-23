package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import com.squareup.moshi.Moshi
import com.squareup.moshi.Types
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory

@Entity(tableName = "songs")
data class SongEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val artist: String = "",
    val sectionsJson: String = "[]", // Stringified List<Section> JSON
    val capo: Int = 0,
    val tuning: String = "Estándar",
    val updatedDate: Long = System.currentTimeMillis()
)

data class Section(
    val name: String,
    val type: String, // "chords" or "tab"
    val content: String // JSON structures
)

class SongTypeConverters {
    private val moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
    private val listType = Types.newParameterizedType(List::class.java, Section::class.java)
    private val adapter = moshi.adapter<List<Section>>(listType)

    @TypeConverter
    fun fromSectionsList(sections: List<Section>?): String {
        return sections?.let { adapter.toJson(it) } ?: "[]"
    }

    @TypeConverter
    fun toSectionsList(json: String?): List<Section> {
        if (json.isNullOrEmpty()) return emptyList()
        return try {
            adapter.fromJson(json) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }
}
