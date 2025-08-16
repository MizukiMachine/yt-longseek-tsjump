import { YouTubeController, SeekResult } from './youtube-controller'

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