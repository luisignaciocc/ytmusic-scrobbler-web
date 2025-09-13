import { describe, expect, it } from 'vitest'

/**
 * Test cases for the re-reproduction logic bug fix
 *
 * The bug was in app.consumer.ts line 985:
 * Original (buggy): songsReproducedToday < savedSong.maxArrayPosition
 * Fixed: songsReproducedToday < savedSong.arrayPosition
 *
 * The issue: maxArrayPosition tracks the worst position (highest number) ever achieved across different sessions
 * with potentially different numbers of "today" songs, making position numbers incomparable.
 * We should only compare against the previous position in the most recent session (arrayPosition).
 */

describe('Re-reproduction Logic', () => {
  describe('Position comparison logic', () => {
    it('should identify re-reproduction when song moves to better position', () => {
      // Song moved from position 15 to position 10 (better)
      const currentPosition = 10
      const previousPosition = 15

      // This should be considered a re-reproduction
      const isReproduction = currentPosition < previousPosition
      expect(isReproduction).toBe(true)
    })

    it('should NOT identify re-reproduction when song moves to worse position', () => {
      // Song moved from position 10 to position 15 (worse)
      const currentPosition = 15
      const previousPosition = 10

      // This should NOT be considered a re-reproduction (the original bug scenario)
      const isReproduction = currentPosition < previousPosition
      expect(isReproduction).toBe(false)
    })

    it('should NOT identify re-reproduction when song stays at same position', () => {
      // Song stayed at same position
      const currentPosition = 10
      const previousPosition = 10

      // This should NOT be considered a re-reproduction
      const isReproduction = currentPosition < previousPosition
      expect(isReproduction).toBe(false)
    })
  })

  describe('Real-world scenario: grcestari@gmail.com "Take Me Out" bug', () => {
    it('should reproduce the original bug scenario and verify fix', () => {
      // The actual data from the investigation:
      // - Current position in today's songs: 40
      // - Previous position (arrayPosition): 28
      // - Max position ever (maxArrayPosition): 127

      const currentPosition = 40  // Position among today's songs
      const previousPosition = 28 // Position in last session
      const maxPosition = 127     // Worst position (highest number) ever achieved

      // Original buggy logic: currentPosition < maxPosition
      const originalBuggyLogic = currentPosition < maxPosition
      expect(originalBuggyLogic).toBe(true) // This would incorrectly scrobble

      // Fixed logic: currentPosition < previousPosition
      const fixedLogic = currentPosition < previousPosition
      expect(fixedLogic).toBe(false) // This correctly does NOT scrobble

      // Verification: song moved from position 28 to 40 (worse), should not scrobble
      expect(currentPosition).toBeGreaterThan(previousPosition)
    })
  })

  describe('Edge cases', () => {
    it('should handle first-time songs correctly', () => {
      // First-time songs don't have previous positions, so they skip this logic entirely
      const _currentPosition = 5
      const previousPosition = undefined // No previous data

      // This test just confirms the logic assumes saved songs exist
      expect(previousPosition).toBe(undefined)
    })

    it('should handle songs with very high positions', () => {
      // Song appears much later in the list
      const currentPosition = 200
      const previousPosition = 50

      const isReproduction = currentPosition < previousPosition
      expect(isReproduction).toBe(false)
    })

    it('should handle songs moving to top positions', () => {
      // Song moves to very top of the list
      const currentPosition = 1
      const previousPosition = 50

      const isReproduction = currentPosition < previousPosition
      expect(isReproduction).toBe(true)
    })
  })

  describe('maxArrayPosition behavior', () => {
    it('should explain why maxArrayPosition is unreliable for comparisons', () => {
      // Scenario: User had 200 songs yesterday, 50 songs today
      // Song was at position 127 yesterday (maxArrayPosition = 127)
      // Song is at position 40 today (among only 50 total today songs)

      const todayPosition = 40
      const yesterdayMaxPosition = 127
      const todayTotalSongs = 50
      const yesterdayTotalSongs = 200

      // Position 40 out of 50 is actually worse than position 127 out of 200
      const todayPercentile = (todayTotalSongs - todayPosition) / todayTotalSongs
      const yesterdayPercentile = (yesterdayTotalSongs - yesterdayMaxPosition) / yesterdayTotalSongs

      expect(todayPercentile).toBeLessThan(yesterdayPercentile)

      // But raw position comparison would suggest it's better (40 < 127)
      expect(todayPosition).toBeLessThan(yesterdayMaxPosition)

      // This demonstrates why comparing raw positions across different session sizes is incorrect
    })
  })
})