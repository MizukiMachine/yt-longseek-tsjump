export interface SeekResult {
  success: boolean
  clamped: boolean
  clampedTo?: 'start' | 'end' | 'live-edge'
  error?: 'video-not-found' | 'not-seekable'
}

export class YouTubeController {
  private readonly LIVE_EDGE_BUFFER = 3 // seconds before live edge

  getVideoElement(): HTMLVideoElement | null {
    return document.querySelector('video')
  }

  getSeekableRange(): { start: number; end: number } | null {
    const video = this.getVideoElement()
    if (!video || video.seekable.length === 0) {
      return null
    }
    return {
      start: video.seekable.start(0),
      end: video.seekable.end(0)
    }
  }

  seekBySeconds(seconds: number): void {
    this.seekBySecondsWithResult(seconds)
  }

  seekBySecondsWithResult(seconds: number): SeekResult {
    const video = this.getVideoElement()
    if (!video) {
      return { success: false, clamped: false, error: 'video-not-found' }
    }

    const range = this.getSeekableRange()
    if (!range) {
      return { success: false, clamped: false, error: 'not-seekable' }
    }

    const newTime = video.currentTime + seconds
    let clampedTime = newTime
    let clamped = false
    let clampedTo: 'start' | 'end' | 'live-edge' | undefined

    // Check if seeking before start
    if (newTime < range.start) {
      clampedTime = range.start
      clamped = true
      clampedTo = 'start'
    }
    // Check if seeking too close to live edge (prevent video termination)
    else if (newTime > range.end - this.LIVE_EDGE_BUFFER) {
      clampedTime = Math.max(range.start, range.end - this.LIVE_EDGE_BUFFER)
      clamped = true
      clampedTo = newTime > range.end ? 'end' : 'live-edge'
    }

    video.currentTime = clampedTime
    return { success: true, clamped, clampedTo }
  }

  isAdPlaying(): boolean {
    return document.querySelector('.ad-showing') !== null ||
           document.querySelector('.ytp-ad-player-overlay') !== null
  }
}