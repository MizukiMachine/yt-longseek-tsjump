import { YouTubeController, SeekResult } from './youtube-controller'
import { KeyboardShortcutHandler } from './keyboard-shortcuts'
import { getCurrentNetherlandsTime, calculateTimeDifference, adjustForYesterday } from './netherlands-time'
import { parseTimeToSeconds } from './time-parser'

class ContentScript {
  private controller: YouTubeController
  private shortcutHandler: KeyboardShortcutHandler

  constructor() {
    this.controller = new YouTubeController()
    this.shortcutHandler = new KeyboardShortcutHandler(this.controller)
    this.setupMessageListener()
    this.loadSettings()
  }

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