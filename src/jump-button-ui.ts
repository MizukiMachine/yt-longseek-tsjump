export class JumpButtonUI {
  createButton(): void {
    const controlsContainer = document.querySelector('.ytp-right-controls')
    if (!controlsContainer) return

    const jumpButton = document.createElement('button')
    jumpButton.className = 'ytls-jump-button ytp-button'
    jumpButton.textContent = 'Jump'
    
    jumpButton.onclick = () => {
      if (!document.querySelector('.ytls-draggable-card')) {
        const card = document.createElement('div')
        card.className = 'ytls-draggable-card'
        document.body.appendChild(card)
      }
    }

    controlsContainer.appendChild(jumpButton)
  }
}