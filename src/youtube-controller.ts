export class YouTubeController {
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
    const video = this.getVideoElement()
    if (!video) return

    const range = this.getSeekableRange()
    if (!range) return

    const newTime = video.currentTime + seconds
    video.currentTime = Math.max(range.start, Math.min(range.end, newTime))
  }

  isAdPlaying(): boolean {
    return document.querySelector('.ad-showing') !== null ||
           document.querySelector('.ytp-ad-player-overlay') !== null
  }
}