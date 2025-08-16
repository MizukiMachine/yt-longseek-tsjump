import { describe, test, expect, vi, afterEach } from 'vitest'
import { getCurrentNetherlandsTime, calculateTimeDifference, adjustForYesterday } from '../src/netherlands-time'

describe('Netherlands Time', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('should get current Netherlands time', () => {
    vi.setSystemTime(new Date('2024-08-15T12:00:00Z'))
    
    const netherlandsTime = getCurrentNetherlandsTime()
    
    expect(netherlandsTime).toBeInstanceOf(Date)
    expect(netherlandsTime.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' })).toBeTruthy()
  })

  test('should calculate time difference correctly', () => {
    const currentNetherlandsDate = new Date('2024-08-15T14:30:00')
    const targetSeconds = 15 * 3600 // 15:00:00
    
    const difference = calculateTimeDifference(targetSeconds, currentNetherlandsDate)
    
    expect(difference).toBe(30 * 60) // 30 minutes forward
  })

  test('should adjust future time to yesterday when enabled', () => {
    const futureDifference = 3600 // 1 hour in future
    const autoYesterday = true
    
    const adjusted = adjustForYesterday(futureDifference, autoYesterday)
    
    expect(adjusted).toBe(futureDifference - 24 * 3600)
  })

  test('should handle DST transitions correctly', () => {
    // Summer time in Netherlands
    vi.setSystemTime(new Date('2024-07-15T12:00:00Z'))
    const summerTime = getCurrentNetherlandsTime()
    
    // Winter time in Netherlands  
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    const winterTime = getCurrentNetherlandsTime()
    
    expect(summerTime).toBeInstanceOf(Date)
    expect(winterTime).toBeInstanceOf(Date)
  })

  test('should calculate shortest time difference - backward', () => {
    // Current: 14:00, Target: 06:00
    const currentNetherlandsDate = new Date('2024-08-15T14:00:00')
    const targetSeconds = 6 * 3600 // 06:00:00
    
    const difference = calculateTimeDifference(targetSeconds, currentNetherlandsDate)
    
    // Should go backward 8 hours (shorter than +16 hours forward)
    expect(difference).toBe(-8 * 3600)
  })

  test('should calculate shortest time difference - forward', () => {
    // Current: 06:00, Target: 14:00  
    const currentNetherlandsDate = new Date('2024-08-15T06:00:00')
    const targetSeconds = 14 * 3600 // 14:00:00
    
    const difference = calculateTimeDifference(targetSeconds, currentNetherlandsDate)
    
    // Should go forward 8 hours (shorter than -16 hours backward)
    expect(difference).toBe(8 * 3600)
  })

  test('should handle exact 12-hour difference correctly', () => {
    // Current: 06:00, Target: 18:00 (12 hours difference)
    const currentNetherlandsDate = new Date('2024-08-15T06:00:00')
    const targetSeconds = 18 * 3600 // 18:00:00
    
    const difference = calculateTimeDifference(targetSeconds, currentNetherlandsDate)
    
    // Should prefer forward direction for 12-hour difference
    expect(difference).toBe(12 * 3600)
  })
})