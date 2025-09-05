// Simple test to verify Vitest setup
import { describe, it, expect } from 'vitest'

function add(a: number, b: number): number {
  return a + b
}

function multiply(a: number, b: number): number {
  return a * b
}

describe('Math functions', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5)
    expect(add(-1, 1)).toBe(0)
    expect(add(0, 0)).toBe(0)
  })

  it('should multiply two numbers correctly', () => {
    expect(multiply(3, 4)).toBe(12)
    expect(multiply(-2, 5)).toBe(-10)
    expect(multiply(0, 100)).toBe(0)
  })
})