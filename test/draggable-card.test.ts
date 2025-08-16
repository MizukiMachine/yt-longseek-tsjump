import { describe, test, expect, beforeEach, vi } from 'vitest'
import { DraggableCardUI } from '../src/draggable-card-ui'

describe('Draggable Card UI', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  test('should create draggable card with time input', () => {
    const player = document.createElement('div')
    player.className = 'html5-video-player'
    document.body.appendChild(player)

    const draggableCard = new DraggableCardUI()
    draggableCard.show()

    const card = document.querySelector('.ytls-draggable-card')
    const timeInput = card?.querySelector('input[type="text"]') as HTMLInputElement
    
    expect(card).not.toBeNull()
    expect(timeInput).not.toBeNull()
    expect(timeInput?.placeholder).toBe('HH:mm')
  })

  test('should handle time jump on Enter key', () => {
    const player = document.createElement('div')
    player.className = 'html5-video-player'
    document.body.appendChild(player)

    const mockJumpCallback = vi.fn()
    const draggableCard = new DraggableCardUI(mockJumpCallback)
    draggableCard.show()

    const timeInput = document.querySelector('.ytls-draggable-card input') as HTMLInputElement
    timeInput.value = '14:30'
    
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
    timeInput.dispatchEvent(enterEvent)

    expect(mockJumpCallback).toHaveBeenCalledWith('14:30')
  })

  test('should be draggable within player bounds', () => {
    const player = document.createElement('div')
    player.className = 'html5-video-player'
    player.style.width = '800px'
    player.style.height = '600px'
    player.style.position = 'relative'
    document.body.appendChild(player)

    const draggableCard = new DraggableCardUI()
    draggableCard.show()

    const card = document.querySelector('.ytls-draggable-card') as HTMLElement
    expect(card.style.position).toBe('absolute')
    expect(parseInt(card.style.top)).toBeGreaterThanOrEqual(0)
    expect(parseInt(card.style.left)).toBeGreaterThanOrEqual(0)
  })

  test('should save position to localStorage', () => {
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

    const player = document.createElement('div')
    player.className = 'html5-video-player'
    document.body.appendChild(player)

    const draggableCard = new DraggableCardUI()
    draggableCard.setPosition(100, 200)

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'ytls-card-position',
      expect.stringContaining('"x":100,"y":200')
    )
  })

  test('should hide card on Escape key', () => {
    const player = document.createElement('div')
    player.className = 'html5-video-player'
    document.body.appendChild(player)

    const draggableCard = new DraggableCardUI()
    draggableCard.show()

    const card = document.querySelector('.ytls-draggable-card') as HTMLElement
    expect(card.style.display).not.toBe('none')

    const escEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(escEvent)

    expect(card.style.display).toBe('none')
  })
})

