import { describe, test, expect } from 'vitest'
import { parseTimeToSeconds } from '../src/time-parser'

describe('Time Parser', () => {
  test('should convert "14:30" format to seconds', () => {
    const result = parseTimeToSeconds('14:30')
    expect(result).toBe(14 * 3600 + 30 * 60) // 52200 seconds
  })

  test('should convert "14:30:45" format to seconds', () => {
    const result = parseTimeToSeconds('14:30:45')
    expect(result).toBe(14 * 3600 + 30 * 60 + 45) // 52245 seconds
  })

  test('should throw error for invalid format', () => {
    expect(() => parseTimeToSeconds('invalid')).toThrow()
  })

  test('should throw error for hours >= 24', () => {
    expect(() => parseTimeToSeconds('24:00')).toThrow()
  })

  test('should throw error for minutes >= 60', () => {
    expect(() => parseTimeToSeconds('12:60')).toThrow()
  })
})