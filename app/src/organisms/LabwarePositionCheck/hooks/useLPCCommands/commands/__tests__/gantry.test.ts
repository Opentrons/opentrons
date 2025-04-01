import { it, describe, expect } from 'vitest'

import { fullHomeCommands } from '../gantry'

describe('gantry commands', () => {
  describe('fullHomeCommands', () => {
    it('should return home command with empty params', () => {
      const result = fullHomeCommands()

      expect(result).toEqual([{ commandType: 'home', params: {} }])
    })

    it('should return an array with exactly one command', () => {
      const result = fullHomeCommands()

      expect(result).toHaveLength(1)
      expect(result[0].commandType).toBe('home')
    })

    it('should return a new array each time it is called', () => {
      const result1 = fullHomeCommands()
      const result2 = fullHomeCommands()

      expect(result1).toEqual(result2)
      expect(result1).not.toBe(result2)
    })
  })
})
