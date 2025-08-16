export class DraggableCardUI {
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
      this.card.style.top = '20px'
      this.card.style.left = '20px'
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
      if (e.key === 'Enter' && this.onTimeJump) {
        this.onTimeJump(timeInput.value)
      }
      if (e.key === 'Escape') {
        this.hide()
      }
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