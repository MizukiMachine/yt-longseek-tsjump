import { describe, test, expect, beforeEach, vi } from 'vitest'
import { YouTubeController } from '../src/youtube-controller'

describe('YouTube Controller', () => {
  let controller: YouTubeController
  let mockVideo: HTMLVideoElement

  beforeEach(() => {
    mockVideo = {
      currentTime: 1000,
      duration: 3600,
      paused: false,
      seekable: {
        length: 1,
        start: vi.fn(() => 0),
        end: vi.fn(() => 3600)
      }
    } as any

    document.querySelector = vi.fn(() => mockVideo)
    controller = new YouTubeController()
  })

  test('should get video element', () => {
    const video = controller.getVideoElement()
    expect(video).toBe(mockVideo)
  })

  test('should get seekable range', () => {
    const range = controller.getSeekableRange()
    expect(range).toEqual({ start: 0, end: 3600 })
  })

  test('should seek video by seconds', () => {
    controller.seekBySeconds(100)
    expect(mockVideo.currentTime).toBe(1100)
  })

  test('should clamp seek to valid range', () => {
    controller.seekBySeconds(3000) // Would go beyond end
    expect(mockVideo.currentTime).toBe(3597) // 3 seconds before end
    
    mockVideo.currentTime = 50
    controller.seekBySeconds(-100) // Would go before start
    expect(mockVideo.currentTime).toBe(0)
  })

  test('should detect ads', () => {
    document.querySelector = vi.fn((selector) => {
      if (selector === '.ad-showing') return {} as Element
      return mockVideo
    })
    
    const controller2 = new YouTubeController()
    expect(controller2.isAdPlaying()).toBe(true)
  })

  test('should return seek result with clamping info', () => {
    // Test normal seek
    const result1 = controller.seekBySecondsWithResult(100)
    expect(result1.success).toBe(true)
    expect(result1.clamped).toBe(false)
    expect(mockVideo.currentTime).toBe(1100)

    // Test clamped seek beyond end
    const result2 = controller.seekBySecondsWithResult(3000)
    expect(result2.success).toBe(true)
    expect(result2.clamped).toBe(true)
    expect(result2.clampedTo).toBe('end')
    expect(mockVideo.currentTime).toBe(3597) // 3 seconds before end
  })

  test('should prevent seeking too close to live edge', () => {
    // Setup live video scenario: seeking within live edge buffer zone
    mockVideo.currentTime = 3590 // 10 seconds from end
    
    const result = controller.seekBySecondsWithResult(10) // Try to go to 3600 (exactly at end)
    expect(result.success).toBe(true)
    expect(result.clamped).toBe(true)
    expect(result.clampedTo).toBe('live-edge')
    // Should stop 3 seconds before end to prevent video termination
    expect(mockVideo.currentTime).toBe(3597)
  })

  test('should handle video element not found', () => {
    document.querySelector = vi.fn(() => null)
    const controller2 = new YouTubeController()
    
    const result = controller2.seekBySecondsWithResult(100)
    expect(result.success).toBe(false)
    expect(result.error).toBe('video-not-found')
  })

  test('should handle no seekable range', () => {
    mockVideo.seekable.length = 0
    
    const result = controller.seekBySecondsWithResult(100)
    expect(result.success).toBe(false)
    expect(result.error).toBe('not-seekable')
  })
})