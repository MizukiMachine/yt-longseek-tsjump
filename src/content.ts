import { YouTubeController, SeekResult } from './youtube-controller'
import { KeyboardShortcutHandler } from './keyboard-shortcuts'
import { getCurrentNetherlandsTime, calculateTimeDifference, adjustForYesterday } from './netherlands-time'
import { parseTimeToSeconds } from './time-parser'

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
      const currentNetherlandsTime = getCurrentNetherlandsTime()
      let timeDifference = calculateTimeDifference(targetSeconds, currentNetherlandsTime)
      timeDifference = adjustForYesterday(timeDifference, autoYesterday)

      const result = this.controller.seekBySecondsWithResult(timeDifference)
      
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
      // Ctrl+Shift+T でフローティングUIをトグル
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
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
    const currentNetherlandsTime = getCurrentNetherlandsTime()
    let timeDifference = calculateTimeDifference(targetSeconds, currentNetherlandsTime)
    timeDifference = adjustForYesterday(timeDifference, autoYesterday)
    
    this.controller.seekBySeconds(timeDifference)
  }
}

new ContentScript()