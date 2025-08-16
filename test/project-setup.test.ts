import { describe, test, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Project Setup', () => {
  test('package.json should exist with required dependencies', () => {
    const packageJsonPath = join(process.cwd(), 'package.json')
    
    expect(existsSync(packageJsonPath)).toBe(true)
    
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    
    expect(packageJson.name).toBe('youtube-longseek-tsjump')
    expect(packageJson.devDependencies).toBeDefined()
    expect(packageJson.devDependencies['@types/chrome']).toBeDefined()
    expect(packageJson.devDependencies['typescript']).toBeDefined()
    expect(packageJson.devDependencies['vite']).toBeDefined()
    expect(packageJson.devDependencies['vitest']).toBeDefined()
  })

  test('tsconfig.json should exist with proper Chrome extension settings', () => {
    const tsconfigPath = join(process.cwd(), 'tsconfig.json')
    
    expect(existsSync(tsconfigPath)).toBe(true)
    
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    
    expect(tsconfig.compilerOptions).toBeDefined()
    expect(tsconfig.compilerOptions.target).toBe('ES2020')
    expect(tsconfig.compilerOptions.lib).toContain('DOM')
    expect(tsconfig.compilerOptions.types).toContain('chrome')
    expect(tsconfig.compilerOptions.strict).toBe(true)
  })
})