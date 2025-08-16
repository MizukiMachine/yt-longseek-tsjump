import { describe, test, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Chrome Extension Structure', () => {
  test('manifest.json should exist with proper configuration', () => {
    const manifestPath = join(process.cwd(), 'src/manifest.json')
    expect(existsSync(manifestPath)).toBe(true)
    
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    
    expect(manifest.manifest_version).toBe(3)
    expect(manifest.name).toBeTruthy()
    expect(manifest.permissions).toContain('storage')
    expect(manifest.host_permissions).toContain('https://www.youtube.com/*')
    expect(manifest.background.service_worker).toBeTruthy()
    expect(manifest.content_scripts[0].matches).toContain('https://www.youtube.com/*')
  })

  test('background script should exist', () => {
    const bgPath = join(process.cwd(), 'src/background.ts')
    expect(existsSync(bgPath)).toBe(true)
  })

  test('content script should exist', () => {
    const contentPath = join(process.cwd(), 'src/content.ts')
    expect(existsSync(contentPath)).toBe(true)
  })

  test('popup html should exist', () => {
    const popupPath = join(process.cwd(), 'src/popup.html')
    expect(existsSync(popupPath)).toBe(true)
  })

  test('keyboard commands should be defined', () => {
    const manifestPath = join(process.cwd(), 'src/manifest.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    
    expect(manifest.commands).toBeDefined()
    expect(manifest.commands['seek-backward-10min']).toBeDefined()
    expect(manifest.commands['seek-forward-10min']).toBeDefined()
  })
})