import { describe, test, expect, beforeEach, vi } from 'vitest'
import { KeyboardShortcutHandler } from '../src/keyboard-shortcuts'

describe('Keyboard Shortcuts', () => {
  let handler: KeyboardShortcutHandler
  let mockController: any

  beforeEach(() => {
    mockController = {
      seekBySeconds: vi.fn(),
      isAdPlaying: vi.fn(() => false)
    }
    handler = new KeyboardShortcutHandler(mockController)
  })

  test('should seek -10 minutes on command', () => {
    handler.handleCommand('seek-backward-10min')
    expect(mockController.seekBySeconds).toHaveBeenCalledWith(-600)
  })

  test('should seek -30 minutes on command', () => {
    handler.handleCommand('seek-backward-30min')
    expect(mockController.seekBySeconds).toHaveBeenCalledWith(-1800)
  })

  test('should seek -60 minutes on command', () => {
    handler.handleCommand('seek-backward-60min')
    expect(mockController.seekBySeconds).toHaveBeenCalledWith(-3600)
  })

  test('should seek forward on forward commands', () => {
    handler.handleCommand('seek-forward-10min')
    expect(mockController.seekBySeconds).toHaveBeenCalledWith(600)
    
    handler.handleCommand('seek-forward-30min')
    expect(mockController.seekBySeconds).toHaveBeenCalledWith(1800)
    
    handler.handleCommand('seek-forward-60min')
    expect(mockController.seekBySeconds).toHaveBeenCalledWith(3600)
  })

  test('should not seek when input is focused', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    
    handler.handleCommand('seek-forward-10min')
    expect(mockController.seekBySeconds).not.toHaveBeenCalled()
    
    document.body.removeChild(input)
  })

  test('should not seek during ads', () => {
    mockController.isAdPlaying.mockReturnValue(true)
    
    handler.handleCommand('seek-forward-10min')
    expect(mockController.seekBySeconds).not.toHaveBeenCalled()
  })
})