// =============================================================
// Weather provider — Open-Meteo (free, no API key)
// Falls back to mock data if fetch fails.
// =============================================================
import type { WeatherData, WeatherCondition } from '@/types'
import { wmoToCondition, weatherIcon } from '@/lib/utils'
import { DEFAULT_WEATHER_LAT, DEFAULT_WEATHER_LON, DEFAULT_LOCATION_NAME } from '@/lib/constants'

interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
  }
}

// Fetch live weather from Open-Meteo (free, CORS-friendly from server)
export async function fetchWeather(
  lat = DEFAULT_WEATHER_LAT,
  lon = DEFAULT_WEATHER_LON,
  location = DEFAULT_LOCATION_NAME,
): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&wind_speed_unit=kmh`

  try {
    const res = await fetch(url, {
      next: { revalidate: 1800 }, // cache 30 min
    })

    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`)

    const json: OpenMeteoResponse = await res.json()
    const c = json.current
    const condition = wmoToCondition(c.weather_code)

    return {
      temperature: Math.round(c.temperature_2m),
      condition,
      description: conditionLabel(condition),
      icon: weatherIcon(condition),
      humidity: c.relative_humidity_2m,
      windSpeed: Math.round(c.wind_speed_10m),
      location,
      fetchedAt: new Date().toISOString(),
    }
  } catch (err) {
    console.warn('[weather] Falling back to mock data:', err)
    return getMockWeather(location)
  }
}

// Mock provider — deterministic based on hour so tests/SSR stays stable
export function getMockWeather(location = DEFAULT_LOCATION_NAME): WeatherData {
  const conditions: WeatherCondition[] = ['clear', 'partly_cloudy', 'cloudy', 'rain']
  const hour = new Date().getHours()
  const condition = conditions[hour % conditions.length]

  return {
    temperature: 14 + (hour % 8),
    condition,
    description: conditionLabel(condition),
    icon: weatherIcon(condition),
    humidity: 65,
    windSpeed: 18,
    location,
    fetchedAt: new Date().toISOString(),
  }
}

function conditionLabel(condition: WeatherCondition): string {
  const labels: Record<WeatherCondition, string> = {
    clear: 'Helder',
    partly_cloudy: 'Half bewolkt',
    cloudy: 'Bewolkt',
    rain: 'Regen',
    heavy_rain: 'Zware regen',
    snow: 'Sneeuw',
    thunderstorm: 'Onweer',
    fog: 'Mist',
    unknown: 'Onbekend',
  }
  return labels[condition]
}
