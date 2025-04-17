import { it, describe, expect } from 'vitest'

import { fullHomeCommands } from '../gantry'

describe('gantry commands', () => {
  describe('fullHomeCommands', () => {
    it('should return home command with empty params', () => {
      const result = fullHomeCommands()

      expect(result).toEqual([{ commandType: 'home', params: {} }])
    })
  })
})
