export function parseTimeToSeconds(timeStr: string): number {
  // Try colon format first: HH:mm or HH:mm:ss
  const colonMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (colonMatch) {
    const hours = parseInt(colonMatch[1])
    const minutes = parseInt(colonMatch[2])
    const seconds = parseInt(colonMatch[3] || '0')

    if (hours >= 24 || minutes >= 60 || seconds >= 60) {
      throw new Error('Invalid time values')
    }

    return hours * 3600 + minutes * 60 + seconds
  }

  // Try non-colon format: HHmm or HHmmss
  const noColonMatch = timeStr.match(/^(\d{2})(\d{2})(\d{2})?$/)
  if (noColonMatch) {
    const hours = parseInt(noColonMatch[1])
    const minutes = parseInt(noColonMatch[2])
    const seconds = parseInt(noColonMatch[3] || '0')

    if (hours >= 24 || minutes >= 60 || seconds >= 60) {
      throw new Error('Invalid time values')
    }

    return hours * 3600 + minutes * 60 + seconds
  }

  throw new Error('Invalid time format')
}