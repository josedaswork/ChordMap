package com.example.data

import android.content.Context
import android.content.SharedPreferences

class SyncSettings(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("sync_settings", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_WEB_APP_URL = "web_app_url"
        private const val KEY_LAST_SYNC = "last_sync_time"
        private const val KEY_AUTO_SYNC = "auto_sync_enabled"
    }

    var webAppUrl: String
        get() = prefs.getString(KEY_WEB_APP_URL, "") ?: ""
        set(value) {
            prefs.edit().putString(KEY_WEB_APP_URL, value.trim()).apply()
        }

    var lastSyncTime: Long
        get() = prefs.getLong(KEY_LAST_SYNC, 0L)
        set(value) {
            prefs.edit().putLong(KEY_LAST_SYNC, value).apply()
        }

    var autoSyncEnabled: Boolean
        get() = prefs.getBoolean(KEY_AUTO_SYNC, false)
        set(value) {
            prefs.edit().putBoolean(KEY_AUTO_SYNC, value).apply()
        }
}
