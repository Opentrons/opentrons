// @flow
import getNextDefaultPipetteId from '../index'

describe('getNextDefaultPipetteId', () => {
  describe('no previous forms', () => {
    const testCases = [
      {
        testMsg: 'both pipettes present: use left pipette',
        equippedPipettes: {'left': 'leftId', 'right': 'rightId'},
        expected: 'leftId',
      },
      {
        testMsg: 'right only: use right',
        equippedPipettes: {'right': 'rightId'},
        expected: 'rightId',
      },
    ]

    testCases.forEach(({testMsg, equippedPipettes, expected}) => {
      test(testMsg, () => {
        const savedForms = {}
        const orderedSteps = []

        const result = getNextDefaultPipetteId.resultFunc(
          savedForms,
          orderedSteps,
          equippedPipettes)

        expect(result).toBe(expected)
      })
    })
  })

  describe('with previous forms', () => {
    const testCases = [
      {
        testMsg: 'last used pipette',
        orderedSteps: ['a', 'a', 'b'],
        expected: 'pipetteId_B',
      },
      {
        testMsg: 'no previous forms use pipettes',
        orderedSteps: ['x', 'x', 'x'],
        expected: 'default',
      },
      {
        testMsg: 'mix of steps with and without pipettes',
        orderedSteps: ['x', 'a', 'x'],
        expected: 'pipetteId_A',
      },
    ]

    testCases.forEach(({testMsg, orderedSteps, expected}) => {
      test(testMsg, () => {
        const savedForms = {
          a: {pipette: 'pipetteId_A'},
          b: {pipette: 'pipetteId_B'},
          x: {}, // no 'pipette' key, eg a Pause step
        }

        const equippedPipettes = {left: 'default'}

        const result = getNextDefaultPipetteId.resultFunc(
          savedForms,
          orderedSteps,
          equippedPipettes)

        expect(result).toBe(expected)
      })
    })
  })
})
