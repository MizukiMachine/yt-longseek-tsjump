import { describe, test, expect, beforeEach, vi } from 'vitest'
import { DraggableCardUI } from '../src/draggable-card-ui'

describe('Draggable Feature', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  test('should make card draggable', () => {
    const player = document.createElement('div')
    player.className = 'html5-video-player'
    player.style.width = '800px'
    player.style.height = '600px'
    player.style.position = 'relative'
    document.body.appendChild(player)

    const draggableCard = new DraggableCardUI()
    draggableCard.show()

    const card = document.querySelector('.ytls-draggable-card') as HTMLElement
    const initialLeft = parseInt(card.style.left)
    const initialTop = parseInt(card.style.top)

    const mouseDownEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
    card.dispatchEvent(mouseDownEvent)

    const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 120 })
    document.dispatchEvent(mouseMoveEvent)

    const mouseUpEvent = new MouseEvent('mouseup')
    document.dispatchEvent(mouseUpEvent)

    expect(parseInt(card.style.left)).toBe(initialLeft + 50)
    expect(parseInt(card.style.top)).toBe(initialTop + 20)
  })

  test('should clamp position within player bounds', () => {
    const player = document.createElement('div')
    player.className = 'html5-video-player'
    player.style.width = '800px'
    player.style.height = '600px'
    player.style.position = 'relative'
    document.body.appendChild(player)

    const draggableCard = new DraggableCardUI()
    draggableCard.show()
    
    const card = document.querySelector('.ytls-draggable-card') as HTMLElement
    
    draggableCard.setPosition(-100, -100)
    expect(parseInt(card.style.left)).toBeGreaterThanOrEqual(0)
    expect(parseInt(card.style.top)).toBeGreaterThanOrEqual(0)

    draggableCard.setPosition(9999, 9999)
    expect(parseInt(card.style.left)).toBeLessThanOrEqual(800)
    expect(parseInt(card.style.top)).toBeLessThanOrEqual(600)
  })

  test('should save position after drag', () => {
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

    const player = document.createElement('div')
    player.className = 'html5-video-player'
    player.style.width = '800px'
    player.style.height = '600px'
    player.style.position = 'relative'
    document.body.appendChild(player)

    const draggableCard = new DraggableCardUI()
    draggableCard.show()

    const card = document.querySelector('.ytls-draggable-card') as HTMLElement
    
    const mouseDownEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
    card.dispatchEvent(mouseDownEvent)

    const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 120 })
    document.dispatchEvent(mouseMoveEvent)

    const mouseUpEvent = new MouseEvent('mouseup')
    document.dispatchEvent(mouseUpEvent)

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'ytls-card-position',
      expect.stringContaining('"x":')
    )
  })
})