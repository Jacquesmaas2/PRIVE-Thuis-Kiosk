interface GeocodeResult {
  latitude: number
  longitude: number
}

interface NominatimResult {
  lat: string
  lon: string
}

export async function geocodeAddress(input: {
  address_line1?: string | null
  postal_code?: string | null
  city?: string | null
  country?: string | null
}): Promise<GeocodeResult | null> {
  const query = [input.address_line1, input.postal_code, input.city, input.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')

  if (!query) {
    return null
  }

  const countryCode = input.country?.trim().toLowerCase() || 'nl'
  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({
      q: query,
      format: 'jsonv2',
      limit: '1',
      addressdetails: '0',
      countrycodes: countryCode,
    }).toString()

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'PRIVE-Thuis-Kiosk/1.0',
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`Geocoding mislukt (HTTP ${res.status})`)
  }

  const results = (await res.json()) as NominatimResult[]
  const first = results[0]

  if (!first) {
    return null
  }

  return {
    latitude: Number.parseFloat(first.lat),
    longitude: Number.parseFloat(first.lon),
  }
}