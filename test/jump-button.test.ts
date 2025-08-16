import { describe, test, expect, beforeEach, vi } from 'vitest'
import { JumpButtonUI } from '../src/jump-button-ui'

describe('Jump Button UI', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  test('should create Jump button in YouTube controls', () => {
    // Setup YouTube controls structure
    const controlsContainer = document.createElement('div')
    controlsContainer.className = 'ytp-right-controls'
    document.body.appendChild(controlsContainer)

    const jumpButtonUI = new JumpButtonUI()
    jumpButtonUI.createButton()

    const jumpButton = document.querySelector('.ytls-jump-button')
    expect(jumpButton).not.toBeNull()
    expect(jumpButton?.textContent).toBe('Jump')
    expect(jumpButton?.parentElement?.className).toBe('ytp-right-controls')
  })

  test('should style Jump button like YouTube native buttons', () => {
    const controlsContainer = document.createElement('div')
    controlsContainer.className = 'ytp-right-controls'
    document.body.appendChild(controlsContainer)

    const jumpButtonUI = new JumpButtonUI()
    jumpButtonUI.createButton()

    const jumpButton = document.querySelector('.ytls-jump-button') as HTMLElement
    expect(jumpButton?.classList.contains('ytp-button')).toBe(true)
  })

  test('should toggle draggable card on Jump button click', () => {
    const controlsContainer = document.createElement('div')
    controlsContainer.className = 'ytp-right-controls'
    document.body.appendChild(controlsContainer)

    const jumpButtonUI = new JumpButtonUI()
    jumpButtonUI.createButton()

    const jumpButton = document.querySelector('.ytls-jump-button') as HTMLElement
    jumpButton.click()

    const draggableCard = document.querySelector('.ytls-draggable-card')
    expect(draggableCard).not.toBeNull()
  })

  test('should handle missing YouTube controls gracefully', () => {
    const jumpButtonUI = new JumpButtonUI()
    
    expect(() => jumpButtonUI.createButton()).not.toThrow()
    
    const jumpButton = document.querySelector('.ytls-jump-button')
    expect(jumpButton).toBeNull()
  })
})

