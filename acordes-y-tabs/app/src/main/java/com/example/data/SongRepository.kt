package com.example.data

import android.content.Context
import com.example.network.AppScriptSyncService
import com.example.network.SyncRequest
import com.example.network.SyncSong
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.withContext

class SongRepository(private val context: Context) {
    private val db = AppDatabase.getDatabase(context)
    private val dao = db.songDao()
    private val syncService = AppScriptSyncService.create()
    private val settings = SyncSettings(context)

    val allSongs: Flow<List<SongEntity>> = dao.getAllSongs()

    suspend fun getSongById(id: Long): SongEntity? = withContext(Dispatchers.IO) {
        dao.getSongById(id)
    }

    suspend fun insertSong(song: SongEntity): Long = withContext(Dispatchers.IO) {
        dao.insertSong(song.copy(updatedDate = System.currentTimeMillis()))
    }

    suspend fun updateSong(song: SongEntity) = withContext(Dispatchers.IO) {
        dao.updateSong(song.copy(updatedDate = System.currentTimeMillis()))
    }

    suspend fun deleteSong(id: Long) = withContext(Dispatchers.IO) {
        dao.deleteSongById(id)
    }

    suspend fun clearAll() = withContext(Dispatchers.IO) {
        dao.clearAll()
    }

    suspend fun syncWithSpreadsheet(): Result<String> = withContext(Dispatchers.IO) {
        val url = settings.webAppUrl
        if (url.isEmpty()) {
            return@withContext Result.failure(Exception("La URL de sincronización no está configurada."))
        }

        try {
            // 1. Get all local songs
            val localSongs = dao.getAllSongs().firstOrNull() ?: emptyList()
            val uploadSongs = localSongs.map {
                SyncSong(
                    title = it.title,
                    artist = it.artist,
                    sectionsJson = it.sectionsJson,
                    updatedDate = it.updatedDate
                )
            }

            // 2. Transmit to Apps Script
            val request = SyncRequest(action = "sync", songs = uploadSongs)
            val response = syncService.sync(url, request)

            if (response.status == "success" && response.songs != null) {
                // 3. Process merged response
                val incomingSongs = response.songs

                incomingSongs.forEach { incoming ->
                    // Find if match exists locally by Title + Artist
                    val matchedLocal = localSongs.find {
                        it.title.equals(incoming.title, ignoreCase = true) &&
                                it.artist.equals(incoming.artist, ignoreCase = true)
                    }

                    if (matchedLocal != null) {
                        // Update local only if incoming is newer
                        if (incoming.updatedDate > matchedLocal.updatedDate) {
                            dao.updateSong(
                                matchedLocal.copy(
                                    title = incoming.title,
                                    artist = incoming.artist,
                                    sectionsJson = incoming.sectionsJson,
                                    updatedDate = incoming.updatedDate
                                )
                            )
                        }
                    } else {
                        // Insert as a new song since it doesn't exist locally
                        dao.insertSong(
                            SongEntity(
                                title = incoming.title,
                                artist = incoming.artist,
                                sectionsJson = incoming.sectionsJson,
                                updatedDate = incoming.updatedDate
                            )
                        )
                    }
                }

                settings.lastSyncTime = System.currentTimeMillis()
                Result.success("Sincronización completada: ${incomingSongs.size} canciones procesadas.")
            } else {
                Result.failure(Exception(response.message ?: "Respuesta fallida de Google Sheets."))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(Exception("Error de conexión: ${e.localizedMessage ?: "Consulte su conexión a internet."}"))
        }
    }
}
