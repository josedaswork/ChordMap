package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.ui.screens.SongEditorScreen
import com.example.ui.screens.SongListScreen
import com.example.ui.theme.MyApplicationTheme
import com.example.viewmodel.SongViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: SongViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    AppNavigation(viewModel = viewModel)
                }
            }
        }
    }
}

@Composable
fun AppNavigation(viewModel: SongViewModel) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = "song_list"
    ) {
        // 1. Song List
        composable("song_list") {
            SongListScreen(
                viewModel = viewModel,
                onNavigateToSong = { id ->
                    navController.navigate("song_editor/$id")
                }
            )
        }

        // 2. Song Editor
        composable(
            route = "song_editor/{id}",
            arguments = listOf(
                navArgument("id") { type = NavType.LongType }
            )
        ) { backStackEntry ->
            val id = backStackEntry.arguments?.getLong("id") ?: 0L
            SongEditorScreen(
                viewModel = viewModel,
                songId = id,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
