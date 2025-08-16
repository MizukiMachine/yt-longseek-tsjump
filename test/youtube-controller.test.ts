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
    expect(mockVideo.currentTime).toBe(3600)
    
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
})