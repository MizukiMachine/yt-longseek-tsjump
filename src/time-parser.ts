export function parseTimeToSeconds(timeStr: string): number {
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!timeMatch) {
    throw new Error('Invalid time format')
  }

  const hours = parseInt(timeMatch[1])
  const minutes = parseInt(timeMatch[2])
  const seconds = parseInt(timeMatch[3] || '0')

  if (hours >= 24 || minutes >= 60 || seconds >= 60) {
    throw new Error('Invalid time values')
  }

  return hours * 3600 + minutes * 60 + seconds
}