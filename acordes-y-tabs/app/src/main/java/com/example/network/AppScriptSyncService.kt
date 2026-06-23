package com.example.network

import com.squareup.moshi.JsonClass
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Url
import java.util.concurrent.TimeUnit

@JsonClass(generateAdapter = true)
data class SyncRequest(
    val action: String,
    val songs: List<SyncSong>
)

@JsonClass(generateAdapter = true)
data class SyncSong(
    val title: String,
    val artist: String,
    val sectionsJson: String,
    val updatedDate: Long
)

@JsonClass(generateAdapter = true)
data class SyncResponse(
    val status: String,
    val songs: List<SyncSong>? = null,
    val message: String? = null
)

interface AppScriptSyncService {
    @POST
    suspend fun sync(
        @Url url: String,
        @Body request: SyncRequest
    ): SyncResponse

    companion object {
        fun create(): AppScriptSyncService {
            val okHttpClient = OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .followRedirects(true)
                .followSslRedirects(true)
                .build()

            // Retrofit base URL is required but overwritten by @Url parameter
            return Retrofit.Builder()
                .baseUrl("https://script.google.com/")
                .client(okHttpClient)
                .addConverterFactory(MoshiConverterFactory.create())
                .build()
                .create(AppScriptSyncService::class.java)
        }
    }
}
