export class DraggableCardUI {
  private card: HTMLElement | null = null
  
  constructor(private onTimeJump?: (time: string) => void) {}
  
  show(): void {
    const player = document.querySelector('.html5-video-player')
    if (!player) return

    this.card = document.createElement('div')
    this.card.className = 'ytls-draggable-card'
    this.card.style.position = 'absolute'
    this.card.style.top = '20px'
    this.card.style.left = '20px'

    const timeInput = document.createElement('input')
    timeInput.type = 'text'
    timeInput.placeholder = 'HH:mm'
    
    timeInput.onkeydown = (e) => {
      if (e.key === 'Enter' && this.onTimeJump) {
        this.onTimeJump(timeInput.value)
      }
    }

    this.card.appendChild(timeInput)
    player.appendChild(this.card)

    document.onkeydown = (e) => {
      if (e.key === 'Escape' && this.card) {
        this.card.style.display = 'none'
      }
    }
  }
  
  setPosition(x: number, y: number): void {
    const position = { x, y, pinned: false, lastInteraction: Date.now() }
    localStorage.setItem('ytls-card-position', JSON.stringify(position))
  }
}