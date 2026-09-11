package com.example.mylifecalendar.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import com.example.mylifecalendar.util.MoonPhase
import com.example.mylifecalendar.util.SkyPeriod
import com.example.mylifecalendar.util.SkyState
import kotlin.random.Random

data class Star(val xFrac: Float, val yFrac: Float, val radius: Float, val alphaSeed: Float)

@Composable
fun CelestialSkyBackground(
    skyState: SkyState,
    moonPhase: MoonPhase,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "celestial_animation")
    val twinkleFactor by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "twinkle"
    )

    // Pre-generate static star positions
    val stars = remember {
        val rng = Random(42)
        List(70) {
            Star(
                xFrac = rng.nextFloat(),
                yFrac = rng.nextFloat() * 0.75f,
                radius = rng.nextFloat() * 1.8f + 0.8f,
                alphaSeed = rng.nextFloat()
            )
        }
    }

    val gradientColors = when (skyState.period) {
        SkyPeriod.DAWN -> listOf(
            Color(0xFF1E1035),
            Color(0xFF4C1D54),
            Color(0xFF9D3C72),
            Color(0xFFEA7A60),
            Color(0xFFFBBF24)
        )
        SkyPeriod.MORNING -> listOf(
            Color(0xFF0284C7),
            Color(0xFF38BDF8),
            Color(0xFF7DD3FC),
            Color(0xFFE0F2FE)
        )
        SkyPeriod.AFTERNOON -> listOf(
            Color(0xFF0369A1),
            Color(0xFF0284C7),
            Color(0xFF38BDF8),
            Color(0xFFBAE6FD)
        )
        SkyPeriod.SUNSET -> listOf(
            Color(0xFF181829),
            Color(0xFF4A154B),
            Color(0xFFB91C1C),
            Color(0xFFF97316),
            Color(0xFFFDE047)
        )
        SkyPeriod.NIGHT -> listOf(
            Color(0xFF060913),
            Color(0xFF0B132B),
            Color(0xFF1C2541),
            Color(0xFF0D1B2A)
        )
    }

    Canvas(modifier = modifier.fillMaxSize()) {
        // Draw sky gradient
        drawRect(
            brush = Brush.verticalGradient(
                colors = gradientColors,
                startY = 0f,
                endY = size.height
            ),
            size = size
        )

        // Draw stars at night, dawn, sunset
        if (skyState.period == SkyPeriod.NIGHT || skyState.period == SkyPeriod.DAWN || skyState.period == SkyPeriod.SUNSET) {
            val baseOpacity = if (skyState.period == SkyPeriod.NIGHT) 0.85f else 0.35f
            stars.forEach { star ->
                val dynamicAlpha = ((star.alphaSeed * twinkleFactor) * baseOpacity).coerceIn(0f, 1f)
                drawCircle(
                    color = Color.White.copy(alpha = dynamicAlpha),
                    radius = star.radius,
                    center = Offset(star.xFrac * size.width, star.yFrac * size.height)
                )
            }
        }

        // Draw Celestial Body (Sun or Moon)
        if (skyState.period == SkyPeriod.NIGHT || skyState.period == SkyPeriod.DAWN) {
            drawMoon(moonPhase, size)
        } else {
            drawSun(skyState, size)
        }
    }
}

private fun DrawScope.drawSun(skyState: SkyState, canvasSize: Size) {
    val sunCenterX = canvasSize.width * 0.82f
    val sunCenterY = canvasSize.height * 0.12f
    val sunRadius = 26f

    // Corona glow
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(Color(0xFFFFD54F).copy(alpha = 0.5f), Color.Transparent),
            center = Offset(sunCenterX, sunCenterY),
            radius = sunRadius * 3.5f
        ),
        radius = sunRadius * 3.5f,
        center = Offset(sunCenterX, sunCenterY)
    )

    // Sun core
    drawCircle(
        color = Color(0xFFFFF176),
        radius = sunRadius,
        center = Offset(sunCenterX, sunCenterY)
    )
}

private fun DrawScope.drawMoon(moonPhase: MoonPhase, canvasSize: Size) {
    val moonCenterX = canvasSize.width * 0.82f
    val moonCenterY = canvasSize.height * 0.12f
    val moonRadius = 24f

    // Soft moonlight aura
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(Color(0xFFE2E8F0).copy(alpha = 0.25f), Color.Transparent),
            center = Offset(moonCenterX, moonCenterY),
            radius = moonRadius * 2.8f
        ),
        radius = moonRadius * 2.8f,
        center = Offset(moonCenterX, moonCenterY)
    )

    // Base moon sphere (dark side)
    drawCircle(
        color = Color(0xFF1E293B).copy(alpha = 0.65f),
        radius = moonRadius,
        center = Offset(moonCenterX, moonCenterY)
    )

    // Illuminated phase disk
    val illAlpha = (moonPhase.illumination).coerceIn(0.2f, 0.95f)
    drawCircle(
        color = Color(0xFFF1F5F9).copy(alpha = illAlpha),
        radius = moonRadius * (0.4f + 0.6f * moonPhase.illumination),
        center = Offset(moonCenterX, moonCenterY)
    )
}
