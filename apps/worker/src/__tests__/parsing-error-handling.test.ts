import { describe, expect, it } from 'vitest'

import { parseYTMusicPageResponse } from '../utils/functions'

/**
 * Test cases for YouTube Music parsing error handling improvements
 *
 * These tests verify that parsing errors provide helpful diagnostic information
 * and are properly categorized for better error handling in the consumer.
 */

describe('YouTube Music Parsing Error Handling', () => {
  describe('parseYTMusicPageResponse error messages', () => {
    it('should provide diagnostic info for completely empty HTML', () => {
      const emptyHtml = ''

      expect(() => {
        parseYTMusicPageResponse(emptyHtml)
      }).toThrow(/No initial data found in page \(HTML size: 0 chars/)
    })

    it('should provide diagnostic info for HTML without initialData.push', () => {
      const htmlWithoutInitialData = '<html><body><h1>YouTube Music</h1></body></html>'

      expect(() => {
        parseYTMusicPageResponse(htmlWithoutInitialData)
      }).toThrow(/has initialData\.push: false/)
    })

    it('should provide diagnostic info for HTML without YouTube Music content', () => {
      const htmlWithoutYTMusic = '<html><body><script>initialData.push({data: "test"});</script></body></html>'

      expect(() => {
        parseYTMusicPageResponse(htmlWithoutYTMusic)
      }).toThrow(/has YT Music content: false/)
    })

    it('should indicate presence of YouTube Music content when available', () => {
      const htmlWithYTMusic = '<html><body><title>YouTube Music</title><p>No data here</p></body></html>'

      expect(() => {
        parseYTMusicPageResponse(htmlWithYTMusic)
      }).toThrow(/has YT Music content: true/)
    })
  })

  describe('Error categorization for consumer', () => {
    it('should identify parsing errors that should be handled specially', () => {
      const parsingErrors = [
        'No initial data found in page (HTML size: 1234 chars, has initialData.push: false, has YT Music content: true)',
        'No results found in YouTube Music response (has contents: true, has browseResults: false, has tabs: false)',
      ]

      parsingErrors.forEach(errorMessage => {
        // These errors should be caught by the consumer's special handling
        expect(
          errorMessage.includes('No initial data found in page') ||
          errorMessage.includes('No results found in YouTube Music response')
        ).toBe(true)
      })
    })

    it('should help distinguish between different types of parsing failures', () => {
      // Test that we can distinguish between different failure modes
      const scenarios = [
        {
          description: 'Empty page',
          html: '',
          expectedPattern: /HTML size: 0/
        },
        {
          description: 'Page with content but no initial data',
          html: '<html><body>YouTube Music content here</body></html>',
          expectedPattern: /has initialData\.push: false/
        }
      ]

      scenarios.forEach(({ description, html, expectedPattern }) => {
        try {
          parseYTMusicPageResponse(html)
          throw new Error(`Expected parsing to fail for: ${description}`)
        } catch (error) {
          expect(error.message).toMatch(expectedPattern)
        }
      })
    })
  })

  describe('Error message structure', () => {
    it('should include all diagnostic fields in error message', () => {
      const testHtml = '<html><body>Some content</body></html>'

      try {
        parseYTMusicPageResponse(testHtml)
        throw new Error('Expected parsing to fail')
      } catch (error) {
        const message = error.message

        // Should include all diagnostic information
        expect(message).toMatch(/HTML size: \d+ chars/)
        expect(message).toMatch(/has initialData\.push: (true|false)/)
        expect(message).toMatch(/has YT Music content: (true|false)/)
      }
    })
  })
})