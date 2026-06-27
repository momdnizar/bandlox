import { NextRequest, NextResponse } from 'next/server'
import { searchSuggestions } from '@/lib/search'

/**
 * GET /api/search/suggestions?q=
 *
 * Returns ranked search suggestions (products + collections).
 * Used by the SearchModal for instant autocomplete.
 *
 * Query params:
 *   q       - search term (required)
 *   limit   - max suggestions (default 8)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '8', 10) || 8))

  if (!query.trim()) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const suggestions = await searchSuggestions(query, limit)
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[api/search/suggestions] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}