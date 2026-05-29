/**
 * Simple ICS calendar parser for extracting events
 */

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  startDate: Date
  endDate: Date | null
  allDay: boolean
  location?: string
  color?: string
}

/**
 * Parse ICS content and extract events
 */
export function parseICS(icsContent: string): CalendarEvent[] {
  const events: CalendarEvent[] = []
  
  // Find all VEVENT blocks
  const veventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g
  let match

  while ((match = veventRegex.exec(icsContent)) !== null) {
    const eventBlock = match[1]
    const event = parseVEvent(eventBlock)
    if (event) {
      events.push(event)
    }
  }

  return events
}

/**
 * Parse a single VEVENT block
 */
function parseVEvent(veventBlock: string): CalendarEvent | null {
  try {
    // Extract UID
    const uidMatch = veventBlock.match(/UID:(.+?)\r?\n/)
    const uid = uidMatch ? uidMatch[1].trim() : `event-${Date.now()}`

    // Extract SUMMARY
    const summaryMatch = veventBlock.match(/SUMMARY:(.+?)\r?\n/)
    const summary = summaryMatch ? decodeICSText(summaryMatch[1].trim()) : 'Unnamed Event'

    // Extract DESCRIPTION
    const descriptionMatch = veventBlock.match(/DESCRIPTION:(.+?)\r?\n/)
    const description = descriptionMatch ? decodeICSText(descriptionMatch[1].trim()) : undefined

    // Extract LOCATION
    const locationMatch = veventBlock.match(/LOCATION:(.+?)\r?\n/)
    const location = locationMatch ? decodeICSText(locationMatch[1].trim()) : undefined

    // Extract DTSTART
    const dtstartMatch = veventBlock.match(/DTSTART(;[^:]*)?:(.+?)\r?\n/)
    if (!dtstartMatch) return null
    
    const dtstartParam = dtstartMatch[1] || ''
    const dtstartValue = dtstartMatch[2].trim()
    const allDay = dtstartParam.toUpperCase().includes('VALUE=DATE')
    const startDate = parseICSDate(dtstartValue, allDay)

    if (!startDate) return null

    // Extract DTEND
    const dtendMatch = veventBlock.match(/DTEND(;[^:]*)?:(.+?)\r?\n/)
    let endDate: Date | null = null
    if (dtendMatch) {
      const dtendParam = dtendMatch[1] || ''
      const dtendValue = dtendMatch[2].trim()
      const endAllDay = dtendParam.toUpperCase().includes('VALUE=DATE')
      endDate = parseICSDate(dtendValue, endAllDay)
    }

    return {
      id: uid,
      summary,
      description,
      startDate,
      endDate,
      allDay,
      location,
    }
  } catch (error) {
    console.error('Error parsing VEVENT:', error)
    return null
  }
}

/**
 * Parse ICS date format (YYYYMMDD or YYYYMMDDTHHMMSSZ)
 */
function parseICSDate(dateStr: string, isAllDay: boolean): Date | null {
  try {
    if (isAllDay && dateStr.length === 8) {
      // YYYYMMDD format for all-day events
      const year = parseInt(dateStr.substring(0, 4), 10)
      const month = parseInt(dateStr.substring(4, 6), 10) - 1
      const day = parseInt(dateStr.substring(6, 8), 10)
      return new Date(year, month, day)
    }

    if (dateStr.length >= 15) {
      // YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS format
      const year = parseInt(dateStr.substring(0, 4), 10)
      const month = parseInt(dateStr.substring(4, 6), 10) - 1
      const day = parseInt(dateStr.substring(6, 8), 10)
      const hour = parseInt(dateStr.substring(9, 11), 10)
      const minute = parseInt(dateStr.substring(11, 13), 10)
      const second = parseInt(dateStr.substring(13, 15), 10)

      if (dateStr.endsWith('Z')) {
        // UTC time
        return new Date(Date.UTC(year, month, day, hour, minute, second))
      }

      // Local time
      return new Date(year, month, day, hour, minute, second)
    }

    return null
  } catch (error) {
    console.error('Error parsing ICS date:', dateStr, error)
    return null
  }
}

/**
 * Decode ICS text (handle escaped characters)
 */
function decodeICSText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

/**
 * Fetch and parse ICS feed from URL
 */
export async function fetchAndParseICS(url: string): Promise<CalendarEvent[]> {
  try {
    // Convert webcal:// to https://
    const httpUrl = url.replace(/^webcal:\/\//, 'https://')

    const response = await fetch(httpUrl, {
      headers: {
        'User-Agent': 'PRIVE-Thuis-Kiosk/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ICS: ${response.statusText}`)
    }

    const icsContent = await response.text()
    return parseICS(icsContent)
  } catch (error) {
    console.error('Error fetching ICS:', error)
    return []
  }
}
