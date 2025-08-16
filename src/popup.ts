import { parseTimeToSeconds } from './time-parser'

class PopupController {
  private timeInput: HTMLInputElement
  private jumpButton: HTMLButtonElement
  private status: HTMLElement
  private shortSeek: HTMLInputElement
  private mediumSeek: HTMLInputElement
  private longSeek: HTMLInputElement
  private autoYesterday: HTMLInputElement

  constructor() {
    this.timeInput = document.getElementById('timeInput') as HTMLInputElement
    this.jumpButton = document.getElementById('jumpButton') as HTMLButtonElement
    this.status = document.getElementById('status') as HTMLElement
    this.shortSeek = document.getElementById('shortSeek') as HTMLInputElement
    this.mediumSeek = document.getElementById('mediumSeek') as HTMLInputElement
    this.longSeek = document.getElementById('longSeek') as HTMLInputElement
    this.autoYesterday = document.getElementById('autoYesterday') as HTMLInputElement

    this.init()
  }

  private async init(): Promise<void> {
    await this.loadSettings()
    this.setupEventListeners()
  }

  private async loadSettings(): Promise<void> {
    const settings = await chrome.storage.sync.get()
    if (settings.seekMinutes) {
      this.shortSeek.value = settings.seekMinutes.short.toString()
      this.mediumSeek.value = settings.seekMinutes.medium.toString()
      this.longSeek.value = settings.seekMinutes.long.toString()
    }
    if (settings.autoYesterday !== undefined) {
      this.autoYesterday.checked = settings.autoYesterday
    }
  }

  private setupEventListeners(): void {
    this.jumpButton.addEventListener('click', () => this.handleJump())
    this.timeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleJump()
    })

    this.shortSeek.addEventListener('change', () => this.saveSettings())
    this.mediumSeek.addEventListener('change', () => this.saveSettings())
    this.longSeek.addEventListener('change', () => this.saveSettings())
    this.autoYesterday.addEventListener('change', () => this.saveSettings())
  }

  private async handleJump(): Promise<void> {
    try {
      const targetSeconds = parseTimeToSeconds(this.timeInput.value)
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'jump-to-netherlands-time',
          targetSeconds,
          autoYesterday: this.autoYesterday.checked
        })
        this.showStatus('ジャンプしました', 'success')
      }
    } catch (error) {
      this.showStatus('時刻形式が正しくありません', 'error')
    }
  }

  private async saveSettings(): Promise<void> {
    await chrome.storage.sync.set({
      seekMinutes: {
        short: parseInt(this.shortSeek.value) || 10,
        medium: parseInt(this.mediumSeek.value) || 30,
        long: parseInt(this.longSeek.value) || 60
      },
      autoYesterday: this.autoYesterday.checked
    })
  }

  private showStatus(message: string, type: 'success' | 'error'): void {
    this.status.textContent = message
    this.status.style.color = type === 'error' ? '#d32f2f' : '#4caf50'
    setTimeout(() => {
      this.status.textContent = ''
    }, 3000)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController()
})