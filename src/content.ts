
export interface SeekResult {
  success: boolean
  clamped: boolean
  clampedTo?: 'start' | 'end' | 'live-edge'
  error?: 'video-not-found' | 'not-seekable'
}

export class YouTubeController {
  private readonly LIVE_EDGE_BUFFER = 3

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

    if (newTime < range.start) {
      clampedTime = range.start
      clamped = true
      clampedTo = 'start'
    }
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

    if (targetTime < range.start) {
      clampedTime = range.start
      clamped = true
      clampedTo = 'start'
    }
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
  
  const forwardDiff = targetSeconds - currentNetherlandsSeconds
  const backwardDiff = forwardDiff + (forwardDiff < 0 ? 24 * 3600 : -24 * 3600)
  
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
  
  const forwardDiff = targetSeconds - liveEdgeSeconds
  const backwardDiff = forwardDiff + (forwardDiff < 0 ? 24 * 3600 : -24 * 3600)
  
  return Math.abs(forwardDiff) <= Math.abs(backwardDiff) ? forwardDiff : backwardDiff
}

export function adjustAbsoluteForYesterday(timeDifference: number, autoYesterday: boolean): number {
  if (autoYesterday && timeDifference > 0) {
    return timeDifference - 24 * 3600
  }
  return timeDifference
}

export function parseTimeToSeconds(timeStr: string): number {
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

class JumpButtonUI {
  public draggableCard: DraggableCardUI

  constructor(private controller: YouTubeController) {
    this.draggableCard = new DraggableCardUI((time) => this.handleTimeJump(time))
  }

  createButton(): void {
    const controlsContainer = document.querySelector('.ytp-right-controls')
    if (!controlsContainer || document.querySelector('.ytls-jump-button')) return

    const jumpButton = document.createElement('button')
    jumpButton.className = 'ytls-jump-button ytp-button'
    jumpButton.textContent = 'Jump'
    
    jumpButton.onclick = () => {
      this.draggableCard.toggle()
    }

    controlsContainer.appendChild(jumpButton)
  }

  private handleTimeJump(timeInput: string): void {
    try {
      const targetSeconds = parseTimeToSeconds(timeInput.trim())
      
      const liveEdgeTime = this.controller.getLiveEdgeTime()
      if (liveEdgeTime === null) return

      const liveEdgeNetherlandsTime = getCurrentNetherlandsTime()
      let timeDifference = calculateAbsoluteTimeDifference(targetSeconds, liveEdgeNetherlandsTime)
      timeDifference = adjustAbsoluteForYesterday(timeDifference, true)

      const targetTime = liveEdgeTime + timeDifference
      this.controller.seekToAbsoluteTime(targetTime)
    } catch (error) {
      console.error('Time jump failed:', error)
    }
  }
}

class DraggableCardUI {
  private card: HTMLElement | null = null
  private isVisible = false
  
  constructor(private onTimeJump?: (time: string) => void) {}
  
  show(): void {
    const player = document.querySelector('.html5-video-player')
    if (!player || this.card) return

    this.card = document.createElement('div')
    this.card.className = 'ytls-draggable-card'
    this.card.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      z-index: 2147483647;
    `

    const timeInput = document.createElement('input')
    timeInput.type = 'text'
    timeInput.placeholder = 'HH:mm'
    timeInput.style.cssText = `
      width: 80px;
      padding: 4px 8px;
      border: 1px solid #444;
      border-radius: 3px;
      background: #222;
      color: white;
      font-size: 14px;
    `
    
    timeInput.onkeydown = (e) => {
      if (e.key === 'Enter' && this.onTimeJump) {
        this.onTimeJump(timeInput.value)
      }
      if (e.key === 'Escape') {
        this.hide()
      }
    }

    this.card.appendChild(timeInput)
    player.appendChild(this.card)
    this.isVisible = true

    document.onkeydown = (e) => {
      if (e.key === 'Escape' && this.card && this.isVisible) {
        this.hide()
      }
    }
  }

  hide(): void {
    if (this.card) {
      this.card.remove()
      this.card = null
      this.isVisible = false
    }
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }
  
  setPosition(x: number, y: number): void {
    const position = { x, y, pinned: false, lastInteraction: Date.now() }
    localStorage.setItem('ytls-card-position', JSON.stringify(position))
  }
}

class ContentScript {
  private controller: YouTubeController
  private shortcutHandler: KeyboardShortcutHandler
  private jumpButtonUI: JumpButtonUI

  constructor() {
    this.controller = new YouTubeController()
    this.shortcutHandler = new KeyboardShortcutHandler(this.controller)
    this.jumpButtonUI = new JumpButtonUI(this.controller)
    this.setupMessageListener()
    this.setupKeyboardListener()
    this.loadSettings()
    this.initializeUI()
  }

  private initializeUI(): void {
    this.setupDOMObserver()
    this.jumpButtonUI.createButton()
  }

  private setupDOMObserver(): void {
    document.addEventListener('yt-navigate-finish', () => {
      setTimeout(() => this.jumpButtonUI.createButton(), 100)
    })

    const observer = new MutationObserver(() => {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.jumpButtonUI.createButton()
      }, 200)
    })

    const targetNode = document.body
    if (targetNode) {
      observer.observe(targetNode, { childList: true, subtree: true })
    }

    setInterval(() => {
      if (!document.querySelector('.ytls-jump-button')) {
        this.jumpButtonUI.createButton()
      }
    }, 5000)
  }

  private debounceTimer: number = 0

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message) => {
      console.log('Received message:', message)
      if (message.action?.startsWith('seek-')) {
        this.shortcutHandler.handleCommand(message.action)
      } else if (message.action === 'jump-to-netherlands-time') {
        this.handleNetherlandsTimeJump(message.targetSeconds, message.autoYesterday)
      }
    })
  }

  private setupKeyboardListener(): void {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && e.key === 'J') {
        const activeElement = document.activeElement
        const isInputFocused = activeElement instanceof HTMLInputElement ||
                              activeElement instanceof HTMLTextAreaElement ||
                              activeElement?.getAttribute('contenteditable') === 'true'
        
        if (!isInputFocused) {
          e.preventDefault()
          this.jumpButtonUI.draggableCard.toggle()
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