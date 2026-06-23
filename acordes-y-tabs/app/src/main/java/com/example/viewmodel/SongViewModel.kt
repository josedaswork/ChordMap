package com.example.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.SongEntity
import com.example.data.SongRepository
import com.example.data.SyncSettings
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class SongViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = SongRepository(application)
    val settings = SyncSettings(application)

    val allSongs: StateFlow<List<SongEntity>> = repository.allSongs
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    private val _syncStatus = MutableStateFlow<SyncStatus>(SyncStatus.Idle)
    val syncStatus: StateFlow<SyncStatus> = _syncStatus.asStateFlow()

    private val _currentSong = MutableStateFlow<SongEntity?>(null)
    val currentSong: StateFlow<SongEntity?> = _currentSong.asStateFlow()

    private var autoSaveJob: Job? = null
    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving.asStateFlow()

    fun loadSong(id: Long) {
        if (id == 0L) {
            _currentSong.value = SongEntity(id = 0L, title = "", artist = "", sectionsJson = "[]")
        } else {
            viewModelScope.launch {
                val song = repository.getSongById(id)
                _currentSong.value = song
            }
        }
    }

    fun updateCurrentSongFields(
        title: String? = null,
        artist: String? = null,
        sectionsJson: String? = null,
        capo: Int? = null,
        tuning: String? = null
    ) {
        val current = _currentSong.value ?: return
        val updated = current.copy(
            title = title ?: current.title,
            artist = artist ?: current.artist,
            sectionsJson = sectionsJson ?: current.sectionsJson,
            capo = capo ?: current.capo,
            tuning = tuning ?: current.tuning,
            updatedDate = System.currentTimeMillis()
        )
        _currentSong.value = updated

        // Trigger debounced auto-save
        if (updated.title.isNotBlank()) {
            _isSaving.value = true
            autoSaveJob?.cancel()
            autoSaveJob = viewModelScope.launch {
                delay(800) // 800ms debounce matching React's setTimeout
                if (updated.id == 0L) {
                    val newId = repository.insertSong(updated)
                    _currentSong.value = updated.copy(id = newId)
                } else {
                    repository.updateSong(updated)
                }
                _isSaving.value = false
            }
        }
    }

    fun saveSongImmediately(song: SongEntity, onComplete: (Long) -> Unit) {
        viewModelScope.launch {
            if (song.id == 0L) {
                val newId = repository.insertSong(song)
                onComplete(newId)
            } else {
                repository.updateSong(song)
                onComplete(song.id)
            }
        }
    }

    fun deleteSong(id: Long, onComplete: () -> Unit) {
        viewModelScope.launch {
            repository.deleteSong(id)
            onComplete()
        }
    }

    fun syncNow() {
        viewModelScope.launch {
            _syncStatus.value = SyncStatus.Loading
            val result = repository.syncWithSpreadsheet()
            result.fold(
                onSuccess = { message ->
                    _syncStatus.value = SyncStatus.Success(message)
                },
                onFailure = { error ->
                    _syncStatus.value = SyncStatus.Error(error.localizedMessage ?: "Error desconocido al sincronizar")
                }
            )
        }
    }

    fun clearSyncStatus() {
        _syncStatus.value = SyncStatus.Idle
    }
}

sealed class SyncStatus {
    object Idle : SyncStatus()
    object Loading : SyncStatus()
    data class Success(val message: String) : SyncStatus()
    data class Error(val message: String) : SyncStatus()
}
