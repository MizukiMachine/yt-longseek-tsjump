// Inline all dependencies for Chrome extension compatibility

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

  getLiveEdgeTime(): number | null {
    const range = this.getSeekableRange()
    return range ? range.end : null
  }

  seekToAbsoluteTime(targetTime: number): SeekResult {
    const video = this.getVideoElement()
    if (!video) {
      return { success: false, clamped: false, error: 'video-not-found' }
    }

    const range = this.getSeekableRange()
    if (!range) {
      return { success: false, clamped: false, error: 'not-seekable' }
    }

    let clampedTime = targetTime
    let clamped = false
    let clampedTo: 'start' | 'end' | 'live-edge' | undefined

    // Check if seeking before start
    if (targetTime < range.start) {
      clampedTime = range.start
      clamped = true
      clampedTo = 'start'
    }
    // Check if seeking too close to live edge (prevent video termination)
    else if (targetTime > range.end - this.LIVE_EDGE_BUFFER) {
      clampedTime = Math.max(range.start, range.end - this.LIVE_EDGE_BUFFER)
      clamped = true
      clampedTo = targetTime > range.end ? 'end' : 'live-edge'
    }

    video.currentTime = clampedTime
    return { success: true, clamped, clampedTo }
  }
}

export class KeyboardShortcutHandler {
  private seekMinutes = {
    short: 10,
    medium: 30,
    long: 60
  }

  constructor(private controller: YouTubeController) {}

  handleCommand(command: string): void {
    if (this.isInputFocused() || this.controller.isAdPlaying()) {
      return
    }

    switch (command) {
      case 'seek-backward-10min':
        this.controller.seekBySeconds(-this.seekMinutes.short * 60)
        break
      case 'seek-backward-30min':
        this.controller.seekBySeconds(-this.seekMinutes.medium * 60)
        break
      case 'seek-backward-60min':
        this.controller.seekBySeconds(-this.seekMinutes.long * 60)
        break
      case 'seek-forward-10min':
        this.controller.seekBySeconds(this.seekMinutes.short * 60)
        break
      case 'seek-forward-30min':
        this.controller.seekBySeconds(this.seekMinutes.medium * 60)
        break
      case 'seek-forward-60min':
        this.controller.seekBySeconds(this.seekMinutes.long * 60)
        break
    }
  }

  private isInputFocused(): boolean {
    const activeElement = document.activeElement
    return activeElement instanceof HTMLInputElement ||
           activeElement instanceof HTMLTextAreaElement ||
           activeElement?.getAttribute('contenteditable') === 'true'
  }

  updateSeekMinutes(short: number, medium: number, long: number): void {
    this.seekMinutes = { short, medium, long }
  }
}

export function getCurrentNetherlandsTime(): Date {
  const netherlandsTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" })
  return new Date(netherlandsTime)
}

export function calculateTimeDifference(targetSeconds: number, currentNetherlandsDate: Date): number {
  const currentNetherlandsSeconds = currentNetherlandsDate.getHours() * 3600 + 
                                   currentNetherlandsDate.getMinutes() * 60 + 
                                   currentNetherlandsDate.getSeconds()
  
  // Calculate both directions
  const forwardDiff = targetSeconds - currentNetherlandsSeconds
  const backwardDiff = forwardDiff + (forwardDiff < 0 ? 24 * 3600 : -24 * 3600)
  
  // Choose the shortest time difference
  return Math.abs(forwardDiff) <= Math.abs(backwardDiff) ? forwardDiff : backwardDiff
}

export function adjustForYesterday(timeDifference: number, autoYesterday: boolean): number {
  if (autoYesterday && timeDifference > 0) {
    return timeDifference - 24 * 3600
  }
  return timeDifference
}

export function calculateAbsoluteTimeDifference(
  targetSeconds: number, 
  liveEdgeNetherlandsTime: Date
): number {
  const liveEdgeSeconds = liveEdgeNetherlandsTime.getHours() * 3600 + 
                         liveEdgeNetherlandsTime.getMinutes() * 60 + 
                         liveEdgeNetherlandsTime.getSeconds()
  
  // Calculate both directions from live edge
  const forwardDiff = targetSeconds - liveEdgeSeconds
  const backwardDiff = forwardDiff + (forwardDiff < 0 ? 24 * 3600 : -24 * 3600)
  
  // Choose the shortest time difference
  return Math.abs(forwardDiff) <= Math.abs(backwardDiff) ? forwardDiff : backwardDiff
}

export function adjustAbsoluteForYesterday(timeDifference: number, autoYesterday: boolean): number {
  if (autoYesterday && timeDifference > 0) {
    return timeDifference - 24 * 3600
  }
  return timeDifference
}

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

class FloatingUI {
  private overlay: HTMLDivElement | null = null
  private isVisible = false

  constructor(private controller: YouTubeController) {}

  createOverlay(): void {
    if (this.overlay) return

    this.overlay = document.createElement('div')
    this.overlay.id = 'yt-longseek-overlay'
    this.overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 16px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 2147483647;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      display: none;
    `

    this.overlay.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 16px;">オランダ時刻ジャンプ</h3>
        <button id="yt-longseek-close" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
      </div>
      <div style="margin-bottom: 12px;">
        <input type="text" id="yt-longseek-time" placeholder="例: 06:00, 1430, 143045" 
               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white;">
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="yt-longseek-jump" style="flex: 1; padding: 8px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">ジャンプ</button>
        <label style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
          <input type="checkbox" id="yt-longseek-auto-yesterday" checked>
          昨日自動調整
        </label>
      </div>
      <div id="yt-longseek-status" style="margin-top: 8px; font-size: 12px; color: #ccc;"></div>
    `

    document.body.appendChild(this.overlay)
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    if (!this.overlay) return

    const closeBtn = this.overlay.querySelector('#yt-longseek-close')
    const jumpBtn = this.overlay.querySelector('#yt-longseek-jump')
    const timeInput = this.overlay.querySelector('#yt-longseek-time') as HTMLInputElement
    const statusDiv = this.overlay.querySelector('#yt-longseek-status')

    closeBtn?.addEventListener('click', () => this.hide())

    jumpBtn?.addEventListener('click', () => this.handleJump())

    timeInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleJump()
      }
    })
  }

  private handleJump(): void {
    if (!this.overlay) return

    const timeInput = this.overlay.querySelector('#yt-longseek-time') as HTMLInputElement
    const autoYesterday = (this.overlay.querySelector('#yt-longseek-auto-yesterday') as HTMLInputElement).checked
    const statusDiv = this.overlay.querySelector('#yt-longseek-status')

    try {
      const targetSeconds = parseTimeToSeconds(timeInput.value.trim())
      
      // Get live edge position and corresponding Netherlands time
      const liveEdgeTime = this.controller.getLiveEdgeTime()
      if (liveEdgeTime === null) {
        if (statusDiv) statusDiv.textContent = 'エラー: ライブエッジが取得できません'
        if (statusDiv) statusDiv.style.color = '#f44336'
        return
      }

      const liveEdgeNetherlandsTime = getCurrentNetherlandsTime()
      let timeDifference = calculateAbsoluteTimeDifference(targetSeconds, liveEdgeNetherlandsTime)
      timeDifference = adjustAbsoluteForYesterday(timeDifference, autoYesterday)

      // Calculate absolute target position
      const targetTime = liveEdgeTime + timeDifference
      const result = this.controller.seekToAbsoluteTime(targetTime)
      
      if (result.success) {
        let message = `ジャンプ完了: ${timeInput.value}`
        if (result.clamped) {
          message += ` (${result.clampedTo === 'live-edge' ? 'ライブエッジ' : '範囲'}調整済み)`
        }
        if (statusDiv) statusDiv.textContent = message
        if (statusDiv) statusDiv.style.color = '#4caf50'
      } else {
        if (statusDiv) statusDiv.textContent = `エラー: ${result.error}`
        if (statusDiv) statusDiv.style.color = '#f44336'
      }
    } catch (error) {
      if (statusDiv) statusDiv.textContent = `入力エラー: ${error instanceof Error ? error.message : '不明'}`
      if (statusDiv) statusDiv.style.color = '#f44336'
    }
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  show(): void {
    this.createOverlay()
    if (this.overlay) {
      this.overlay.style.display = 'block'
      this.isVisible = true
      // Focus on input
      const timeInput = this.overlay.querySelector('#yt-longseek-time') as HTMLInputElement
      timeInput?.focus()
    }
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none'
      this.isVisible = false
    }
  }
}

class ContentScript {
  private controller: YouTubeController
  private shortcutHandler: KeyboardShortcutHandler
  private floatingUI: FloatingUI

  constructor() {
    this.controller = new YouTubeController()
    this.shortcutHandler = new KeyboardShortcutHandler(this.controller)
    this.floatingUI = new FloatingUI(this.controller)
    this.setupMessageListener()
    this.setupKeyboardListener()
    this.loadSettings()
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message) => {
      console.log('Received message:', message)
      if (message.action?.startsWith('seek-')) {
        this.shortcutHandler.handleCommand(message.action)
      } else if (message.action === 'jump-to-netherlands-time') {
        this.handleNetherlandsTimeJump(message.targetSeconds, message.autoYesterday)
      } else if (message.action === 'toggle-floating-ui') {
        this.floatingUI.toggle()
      }
    })
  }

  private setupKeyboardListener(): void {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+U でフローティングUIをトグル（競合の少ないキー）
      if (e.ctrlKey && e.shiftKey && e.key === 'U') {
        // 入力フィールドにフォーカスがない場合のみ
        const activeElement = document.activeElement
        const isInputFocused = activeElement instanceof HTMLInputElement ||
                              activeElement instanceof HTMLTextAreaElement ||
                              activeElement?.getAttribute('contenteditable') === 'true'
        
        if (!isInputFocused) {
          e.preventDefault()
          this.floatingUI.toggle()
        }
      }
    })
  }

  private async loadSettings(): Promise<void> {
    const settings = await chrome.storage.sync.get()
    if (settings.seekMinutes) {
      this.shortcutHandler.updateSeekMinutes(
        settings.seekMinutes.short,
        settings.seekMinutes.medium,
        settings.seekMinutes.long
      )
    }
  }

  private handleNetherlandsTimeJump(targetSeconds: number, autoYesterday: boolean): void {
    // Get live edge position and corresponding Netherlands time
    const liveEdgeTime = this.controller.getLiveEdgeTime()
    if (liveEdgeTime === null) {
      console.error('Cannot get live edge time for Netherlands time jump')
      return
    }

    const liveEdgeNetherlandsTime = getCurrentNetherlandsTime()
    let timeDifference = calculateAbsoluteTimeDifference(targetSeconds, liveEdgeNetherlandsTime)
    timeDifference = adjustAbsoluteForYesterday(timeDifference, autoYesterday)

    // Calculate absolute target position
    const targetTime = liveEdgeTime + timeDifference
    this.controller.seekToAbsoluteTime(targetTime)
  }
}

new ContentScript()