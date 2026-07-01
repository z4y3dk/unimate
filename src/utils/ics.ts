// Minimal client-side iCalendar (.ics) builder + download trigger.
// No external dependency — builds the ICS text format manually.

function pad(n: number) {
  return String(n).padStart(2, '0')
}

// Format a Date as a UTC iCalendar datetime: YYYYMMDDTHHMMSSZ
function toICSDateUTC(date: Date) {
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  )
}

// Escape text per RFC 5545
function escapeICSText(text: string) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function foldLine(line: string) {
  // RFC 5545 recommends folding lines longer than 75 octets; keep it simple/safe.
  if (line.length <= 75) return line
  const chunks: string[] = []
  let i = 0
  while (i < line.length) {
    chunks.push((i === 0 ? '' : ' ') + line.slice(i, i + 74))
    i += 74
  }
  return chunks.join('\r\n')
}

export interface ICSEvent {
  uid: string
  summary: string
  description?: string
  location?: string
  start: Date
  end: Date
  /** Weekly recurrence (e.g. for recurring classes). */
  recurWeekly?: boolean
}

export function buildICS(events: ICSEvent[], calendarName = 'UniMate') {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniMate//Schedule Export//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeICSText(calendarName)}`,
  ]

  const now = toICSDateUTC(new Date())

  for (const ev of events) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${ev.uid}`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(foldLine(`DTSTART:${toICSDateUTC(ev.start)}`))
    lines.push(foldLine(`DTEND:${toICSDateUTC(ev.end)}`))
    lines.push(foldLine(`SUMMARY:${escapeICSText(ev.summary)}`))
    if (ev.description) lines.push(foldLine(`DESCRIPTION:${escapeICSText(ev.description)}`))
    if (ev.location) lines.push(foldLine(`LOCATION:${escapeICSText(ev.location)}`))
    if (ev.recurWeekly) lines.push('RRULE:FREQ=WEEKLY')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadICS(events: ICSEvent[], filename: string, calendarName = 'UniMate') {
  const content = buildICS(events, calendarName)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Returns the next (or today's) date matching the given day-of-week (0=Sun..6=Sat),
// anchored to "today" so weekly RRULE events start from a sensible upcoming occurrence.
export function nextDateForDayOfWeek(dayOfWeek: number, time: string) {
  const [h, m] = time.split(':').map(Number)
  const result = new Date()
  const todayDow = result.getDay()
  let diff = dayOfWeek - todayDow
  if (diff < 0) diff += 7
  result.setDate(result.getDate() + diff)
  result.setHours(h, m, 0, 0)
  return result
}
