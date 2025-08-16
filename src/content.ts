
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
    jumpButton.setAttribute('title', 'Netherlands Time Jump')
    jumpButton.setAttribute('aria-label', 'Netherlands Time Jump')
    
    jumpButton.style.cssText = `
      height: 48px;
      width: auto;
      min-width: 48px;
      padding: 0 8px;
      margin: 0;
      display: inline-block;
      vertical-align: top;
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 12px;
      font-family: Roboto, Arial, sans-serif;
      font-weight: 400;
      line-height: 48px;
      text-align: center;
      position: relative;
      overflow: hidden;
      white-space: nowrap;
      box-sizing: border-box;
    `
    
    jumpButton.onclick = () => {
      this.draggableCard.toggle()
    }

    const insertBeforeButton = controlsContainer.querySelector('.ytp-subtitles-button') || 
                              controlsContainer.querySelector('.ytp-settings-button') ||
                              controlsContainer.querySelector('.ytp-fullscreen-button')
    
    if (insertBeforeButton) {
      controlsContainer.insertBefore(jumpButton, insertBeforeButton)
    } else {
      controlsContainer.appendChild(jumpButton)
    }
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
  private isDragging = false
  private dragOffset = { x: 0, y: 0 }
  private isPinned = false
  private fadeTimer: number = 0
  private isVisible = false
  
  constructor(private onTimeJump?: (time: string) => void) {}
  
  show(): void {
    const player = document.querySelector('.html5-video-player')
    if (!player) return

    this.card = document.createElement('div')
    this.card.className = 'ytls-draggable-card'
    this.card.style.position = 'absolute'
    this.card.style.cursor = 'move'
    
    const savedPosition = this.loadPosition()
    if (savedPosition) {
      this.card.style.left = savedPosition.x + 'px'
      this.card.style.top = savedPosition.y + 'px'
    } else {
      this.setInitialPositionNearJumpButton()
    }

    const container = document.createElement('div')
    container.style.cssText = 'display: flex; align-items: center; gap: 8px;'

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
      if (e.key === 'Enter' && this.onTimeJump && this.isValidTimeInput(timeInput.value.trim())) {
        e.preventDefault()
        this.onTimeJump(timeInput.value.trim())
        timeInput.value = ''
      }
      if (e.key === 'Escape') {
        this.hide()
      }
    }

    timeInput.oninput = (e) => {
      e.stopPropagation()
    }

    const pinButton = document.createElement('button')
    pinButton.innerHTML = '📌'
    pinButton.style.cssText = `
      background: transparent;
      border: 1px solid #444;
      border-radius: 3px;
      color: white;
      cursor: pointer;
      padding: 4px 8px;
      font-size: 14px;
      opacity: ${this.isPinned ? '1' : '0.5'};
    `
    pinButton.onclick = () => {
      this.isPinned = !this.isPinned
      pinButton.style.opacity = this.isPinned ? '1' : '0.5'
      this.savePosition()
      if (!this.isPinned) {
        this.startFadeTimer()
      } else {
        this.clearFadeTimer()
        this.card!.style.opacity = '1'
      }
    }

    container.appendChild(timeInput)
    container.appendChild(pinButton)
    this.card.appendChild(container)
    player.appendChild(this.card)
    
    this.isVisible = true
    this.setupCardStyle()
    if (!this.isPinned) {
      this.startFadeTimer()
    }

    this.setupDragHandlers()
    this.setupResizeHandler()

    document.onkeydown = (e) => {
      if (e.key === 'Escape' && this.card) {
        this.card.style.display = 'none'
      }
    }
  }

  private setupDragHandlers(): void {
    if (!this.card) return

    this.card.onmousedown = (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT') return
      
      this.isDragging = true
      const rect = this.card!.getBoundingClientRect()
      this.dragOffset.x = e.clientX - rect.left
      this.dragOffset.y = e.clientY - rect.top
      e.preventDefault()
    }

    document.onmousemove = (e) => {
      if (!this.isDragging || !this.card) return
      
      const player = this.card.parentElement
      if (!player) return

      const playerRect = player.getBoundingClientRect()
      const cardRect = this.card.getBoundingClientRect()
      
      let newX = e.clientX - playerRect.left - this.dragOffset.x
      let newY = e.clientY - playerRect.top - this.dragOffset.y
      
      newX = Math.max(0, Math.min(newX, playerRect.width - cardRect.width))
      newY = Math.max(0, Math.min(newY, playerRect.height - cardRect.height))
      
      this.card.style.left = newX + 'px'
      this.card.style.top = newY + 'px'
    }

    document.onmouseup = () => {
      if (this.isDragging && this.card) {
        this.isDragging = false
        this.savePosition()
      }
    }
  }

  private savePosition(): void {
    if (!this.card) return
    const x = parseInt(this.card.style.left)
    const y = parseInt(this.card.style.top)
    const position = { x, y, pinned: this.isPinned, lastInteraction: Date.now() }
    localStorage.setItem('ytls-card-position', JSON.stringify(position))
  }

  private loadPosition(): { x: number; y: number; pinned?: boolean } | null {
    try {
      const saved = localStorage.getItem('ytls-card-position')
      if (saved) {
        const position = JSON.parse(saved)
        this.isPinned = position.pinned || false
        return { x: position.x, y: position.y, pinned: position.pinned }
      }
    } catch (e) {}
    return null
  }

  private setupCardStyle(): void {
    if (!this.card) return
    this.card.style.cssText += `
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 12px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      z-index: 2147483647;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: opacity 0.3s ease;
    `
  }

  private startFadeTimer(): void {
    this.clearFadeTimer()
    this.fadeTimer = window.setTimeout(() => {
      if (this.card && !this.isPinned) {
        this.card.style.opacity = '0.3'
        this.fadeTimer = window.setTimeout(() => {
          if (this.card && !this.isPinned) {
            this.hide()
          }
        }, 3000)
      }
    }, 3000)
  }

  private clearFadeTimer(): void {
    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer)
      this.fadeTimer = 0
    }
  }

  private setupResizeHandler(): void {
    const handleResize = () => {
      if (!this.card) return
      
      const player = document.querySelector('.html5-video-player')
      if (!player) return
      
      const playerRect = player.getBoundingClientRect()
      const cardRect = this.card.getBoundingClientRect()
      
      let currentX = parseInt(this.card.style.left) || 0
      let currentY = parseInt(this.card.style.top) || 0
      
      currentX = Math.max(0, Math.min(currentX, playerRect.width - cardRect.width))
      currentY = Math.max(0, Math.min(currentY, playerRect.height - cardRect.height))
      
      this.card.style.left = currentX + 'px'
      this.card.style.top = currentY + 'px'
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('fullscreenchange', handleResize)
  }
  
  private isValidTimeInput(input: string): boolean {
    if (!input || input.length < 3) return false
    
    const colonFormat = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    const noColonFormat = /^(\d{4}|\d{6})$/
    
    if (colonFormat.test(input)) {
      const match = input.match(colonFormat)
      const hours = parseInt(match![1])
      const minutes = parseInt(match![2])
      const seconds = parseInt(match![3] || '0')
      return hours < 24 && minutes < 60 && seconds < 60
    }
    
    if (noColonFormat.test(input)) {
      const hours = parseInt(input.slice(0, 2))
      const minutes = parseInt(input.slice(2, 4))
      const seconds = input.length === 6 ? parseInt(input.slice(4, 6)) : 0
      return hours < 24 && minutes < 60 && seconds < 60
    }
    
    return false
  }

  private setInitialPositionNearJumpButton(): void {
    if (!this.card) return

    setTimeout(() => {
      if (!this.card) return
      
      const player = document.querySelector('.html5-video-player')
      const jumpButton = document.querySelector('.ytls-jump-button')
      
      if (player && jumpButton) {
        const playerRect = player.getBoundingClientRect()
        const buttonRect = jumpButton.getBoundingClientRect()
        
        const cardX = buttonRect.right - playerRect.left + (buttonRect.height * 0.3)
        const cardY = buttonRect.top - playerRect.top
        
        const safeX = Math.max(20, Math.min(cardX, playerRect.width - 200))
        const safeY = Math.max(20, cardY)
        
        this.card.style.left = safeX + 'px'
        this.card.style.top = safeY + 'px'
        this.card.style.right = 'auto'
      } else {
        const playerRect = player?.getBoundingClientRect()
        if (playerRect) {
          const safeBottom = Math.max(90, playerRect.height * 0.15)
          this.card.style.top = Math.max(20, playerRect.height - safeBottom - 100) + 'px'
          this.card.style.right = '20px'
          this.card.style.left = 'auto'
        }
      }
    }, 100)
  }

  setPosition(x: number, y: number): void {
    if (!this.card) return
    
    const player = this.card.parentElement
    if (!player) return
    
    const playerRect = player.getBoundingClientRect()
    const cardRect = this.card.getBoundingClientRect()
    
    x = Math.max(0, Math.min(x, playerRect.width - cardRect.width))
    y = Math.max(0, Math.min(y, playerRect.height - cardRect.height))
    
    this.card.style.left = x + 'px'
    this.card.style.top = y + 'px'
    
    const position = { x, y, pinned: this.isPinned, lastInteraction: Date.now() }
    localStorage.setItem('ytls-card-position', JSON.stringify(position))
  }

  hide(): void {
    if (this.card) {
      this.clearFadeTimer()
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