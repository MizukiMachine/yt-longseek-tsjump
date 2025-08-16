import { describe, test, expect } from 'vitest'

describe('Vitest Environment', () => {
  test('should run basic test successfully', () => {
    expect(1 + 1).toBe(2)
  })

  test('should support async tests', async () => {
    const result = await Promise.resolve(42)
    expect(result).toBe(42)
  })

  test('should support mocking', () => {
    const mockFn = vi.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
  })
})