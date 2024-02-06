import { describe, it, expect } from 'vitest'
import { getNextNonTerminalItemId } from '../utils'
describe('getNextNonTerminalItemId', () => {
  const orderedStepIds = ['1', '2', '3', '4', '5']
  const testCases = [
    {
      name: 'should get the third element when deleting the last two',
      stepsToDelete: ['4', '5'],
      nextNonTerminalItemId: '3',
    },
    {
      name: 'should get the third element when deleting the first two',
      stepsToDelete: ['1', '2'],
      nextNonTerminalItemId: '3',
    },
    {
      name: 'should get the second element when deleting the first one',
      stepsToDelete: ['1'],
      nextNonTerminalItemId: '2',
    },
    {
      name: 'should return null when deleting all steps',
      stepsToDelete: orderedStepIds,
      nextNonTerminalItemId: null,
    },
  ]
  testCases.forEach(({ name, stepsToDelete, nextNonTerminalItemId }) => {
    it(name, () => {
      expect(getNextNonTerminalItemId([...orderedStepIds], stepsToDelete)).toBe(
        nextNonTerminalItemId
      )
    })
  })
})
