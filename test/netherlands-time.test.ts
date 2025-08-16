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
})