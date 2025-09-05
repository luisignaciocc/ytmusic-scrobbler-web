import { describe, it, expect } from 'vitest'
import { sanitizeCookieForHTTP } from '../apps/worker/src/utils/functions'

describe('sanitizeCookieForHTTP', () => {
  it('should remove Unicode characters > 255', () => {
    // Test ellipsis character (…) that caused the original error
    const cookieWithEllipsis = 'session_id=abc123…xyz'
    const result = sanitizeCookieForHTTP(cookieWithEllipsis)
    expect(result).toBe('session_id=abc123xyz')
    expect(result).not.toContain('…')
  })

  it('should remove Unicode characters >= U+0100', () => {
    // Test characters that should be removed (>= U+0100 / 256)
    const cookieWithHighUnicode = 'test=café•™Œ'  // • = U+2022, ™ = U+2122, Œ = U+0152
    const result = sanitizeCookieForHTTP(cookieWithHighUnicode)
    expect(result).toBe('test=café')  // é (U+00E9) stays, others removed
    expect(result).not.toContain('•')  // U+2022 removed
    expect(result).not.toContain('™')  // U+2122 removed  
    expect(result).not.toContain('Œ')  // U+0152 removed
  })

  it('should normalize multiple whitespaces to single space', () => {
    const cookieWithSpaces = 'key1=value1;   key2=value2;     key3=value3'
    const result = sanitizeCookieForHTTP(cookieWithSpaces)
    expect(result).toBe('key1=value1; key2=value2; key3=value3')
  })

  it('should trim leading and trailing whitespace', () => {
    const cookieWithPadding = '  session_id=abc123; user=john  '
    const result = sanitizeCookieForHTTP(cookieWithPadding)
    expect(result).toBe('session_id=abc123; user=john')
  })

  it('should handle empty string', () => {
    const result = sanitizeCookieForHTTP('')
    expect(result).toBe('')
  })

  it('should keep ASCII characters unchanged', () => {
    const normalCookie = 'session_id=abc123; user=john.doe; token=xyz789'
    const result = sanitizeCookieForHTTP(normalCookie)
    expect(result).toBe(normalCookie)
  })

  it('should handle the problematic cookie from blazing.foxy13@gmail.com', () => {
    // Simulate the cookie that had Unicode issues
    const problematicCookie = 'some_cookie=value_with…ellipsis_here; other=normal'
    const result = sanitizeCookieForHTTP(problematicCookie)
    expect(result).toBe('some_cookie=value_withellipsis_here; other=normal')
    expect(() => {
      // This should not throw ByteString conversion error anymore
      new Headers({ 'Cookie': result })
    }).not.toThrow()
  })
})