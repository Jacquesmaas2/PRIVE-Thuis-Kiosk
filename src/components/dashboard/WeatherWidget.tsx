import { Cloud, Wind, Droplets, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { WeatherData } from '@/types'

interface WeatherWidgetProps {
  weather: WeatherData | null
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  if (!weather) {
    return (
      <Card className="lg:col-span-1">
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          Weer niet beschikbaar
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {weather.location}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {/* Temperature + icon */}
          <div className="flex items-center gap-3">
            <span className="text-5xl" aria-hidden>{weather.icon}</span>
            <div>
              <div className="text-4xl font-bold">{weather.temperature}°C</div>
              <div className="text-sm text-muted-foreground">{weather.description}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Droplets className="h-4 w-4" />
              {weather.humidity}%
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="h-4 w-4" />
              {weather.windSpeed} km/u
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
