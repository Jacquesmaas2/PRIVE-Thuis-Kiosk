import { NextRequest, NextResponse } from 'next/server'

// Proxy image search via OpenFoodFacts (free, no API key).
// Only called server-side so the external request never leaks CORS.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ imageUrl: null })

  try {
    const url =
      'https://world.openfoodfacts.org/cgi/search.pl' +
      `?search_terms=${encodeURIComponent(q)}` +
      '&json=1&action=process&page_size=5' +
      '&fields=product_name,image_thumb_url,image_front_thumb_url'

    const res = await fetch(url, {
      headers: { 'User-Agent': 'ThuisKiosk/1.0' },
      next: { revalidate: 3600 }, // cache 1 hour per query
    })

    if (!res.ok) return NextResponse.json({ imageUrl: null })

    const data = await res.json()
    const products: { image_thumb_url?: string; image_front_thumb_url?: string }[] =
      data.products ?? []

    const imageUrl =
      products.find((p) => p.image_thumb_url)?.image_thumb_url ??
      products.find((p) => p.image_front_thumb_url)?.image_front_thumb_url ??
      null

    return NextResponse.json({ imageUrl })
  } catch {
    return NextResponse.json({ imageUrl: null })
  }
}
