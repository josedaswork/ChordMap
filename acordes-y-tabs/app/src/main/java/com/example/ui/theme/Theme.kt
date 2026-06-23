package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = NaturalForeground,
    onPrimary = CreamBackground,
    secondary = SoftSecondary,
    onSecondary = NaturalForeground,
    background = CreamBackground,
    onBackground = NaturalForeground,
    surface = WarmCard,
    onSurface = NaturalForeground,
    outline = SubtleBorder,
    surfaceVariant = SoftSecondary,
    onSurfaceVariant = MutedForeground,
    secondaryContainer = WarmAccent,
    onSecondaryContainer = NaturalForeground
)

private val DarkColorScheme = darkColorScheme(
    primary = CosmicForeground,
    onPrimary = CosmicBackground,
    secondary = CosmicSecondary,
    onSecondary = CosmicForeground,
    background = CosmicBackground,
    onBackground = CosmicForeground,
    surface = CosmicCard,
    onSurface = CosmicForeground,
    outline = CosmicBorder,
    surfaceVariant = CosmicSecondary,
    onSurfaceVariant = CosmicMutedForeground,
    secondaryContainer = CosmicAccent,
    onSecondaryContainer = CosmicForeground
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
