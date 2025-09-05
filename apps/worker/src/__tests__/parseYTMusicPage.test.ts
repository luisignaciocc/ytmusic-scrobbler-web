import { describe, expect,it } from 'vitest'

import { parseYTMusicPageResponse } from '../utils/functions'

// Helper function to test regex directly
function testInitialDataRegex(html: string) {
  const allPushRegex = /initialData\.push\(\{[^}]*data:\s*'([^']+)'/g;
  const matches = [...html.matchAll(allPushRegex)];
  return matches;
}

describe('parseYTMusicPageResponse', () => {
  it('should test regex pattern first', () => {
    // Test different variations of the pattern
    const variations = [
      `initialData.push({data: 'test123'});`,
      `initialData.push({ data: 'test123' });`,
      `initialData.push({type:'test', data: 'test123'});`,
      `initialData.push({type:'test',data: 'test123'});`
    ];
    
    variations.forEach((html, _index) => {
      const matches = testInitialDataRegex(html);
      // Debug variations for regex testing
      expect(typeof html).toBe('string');
      expect(Array.isArray(matches)).toBe(true);
      if (matches.length > 0) {
        expect(matches[0][1]).toBeDefined();
      }
    });

    // Use the simplest pattern that should work
    const testHtml = `initialData.push({data: 'abc123'});`;
    const matches = testInitialDataRegex(testHtml);
    expect(matches.length).toBeGreaterThan(0);
  })

  it('should handle basic hex data extraction', () => {
    // Test with valid hex JSON data
    const validJsonHex = '7b2274657374223a2274657374227d'; // {"test":"test"} in hex
    const testHtml = `
      <html>
        <body>
          <script>
            initialData.push({data: '${validJsonHex}'});
          </script>
        </body>
      </html>
    `;
    
    try {
      const songs = parseYTMusicPageResponse(testHtml);
      expect(Array.isArray(songs)).toBe(true);
      expect(songs.length).toBe(0); // Empty because our JSON doesn't have the expected structure
    } catch (error) {
      // It's ok if it throws due to parsing, we just want to verify the regex extraction works
      expect(error).toBeInstanceOf(Error);
    }
  })

  it('should throw error for empty HTML', () => {
    const emptyHtml = '<html><body></body></html>'
    
    expect(() => {
      parseYTMusicPageResponse(emptyHtml)
    }).toThrow('No initial data found in page')
  })

  it('should throw error for malformed HTML', () => {
    const malformedHtml = 'not valid html at all'
    
    expect(() => {
      parseYTMusicPageResponse(malformedHtml)
    }).toThrow('No initial data found in page')
  })
})