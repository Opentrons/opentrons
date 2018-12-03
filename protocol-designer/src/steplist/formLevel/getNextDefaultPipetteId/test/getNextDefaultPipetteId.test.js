// @flow
import getNextDefaultPipetteId from '../'

describe('getNextDefaultPipetteId', () => {
  describe('no previous forms', () => {
    const testCases = [
      {
        testMsg: 'both pipettes present: use left pipette',
        equippedPipettesById: {
          'leftId': {id: 'leftId', mount: 'left'},
          'rightId': {id: 'rightId', mount: 'right'},
        },
        expected: 'leftId',
      },
      {
        testMsg: 'right only: use right',
        equippedPipettesById: {'rightId': {id: 'rightId', mount: 'right'}},
        expected: 'rightId',
      },
    ]

    testCases.forEach(({testMsg, equippedPipettesById, expected}) => {
      test(testMsg, () => {
        const savedForms = {}
        const orderedSteps = []

        const result = getNextDefaultPipetteId(
          savedForms,
          orderedSteps,
          equippedPipettesById)

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
        expected: 'defaultId',
      },
      {
        testMsg: 'mix of steps with and without pipettes',
        orderedSteps: ['x', 'a', 'x'],
        expected: 'pipetteId_A',
      },
      {
        testMsg: 'missing steps (no key in savedForms)',
        orderedSteps: ['missingStep', 'a', 'missingStep', 'b', 'missingStep'],
        expected: 'pipetteId_B',
      },
      {
        testMsg: 'only missing steps',
        orderedSteps: ['missingStep', 'missingStep'],
        expected: 'defaultId',
      },
    ]

    testCases.forEach(({testMsg, orderedSteps, expected}) => {
      test(testMsg, () => {
        const savedForms = {
          a: {pipette: 'pipetteId_A'},
          b: {pipette: 'pipetteId_B'},
          x: {}, // no 'pipette' key, eg a Pause step
        }

        const equippedPipettesById = {'defaultId': {id: 'defaultId', mount: 'left'}}

        const result = getNextDefaultPipetteId(
          savedForms,
          orderedSteps,
          equippedPipettesById)

        expect(result).toBe(expected)
      })
    })
  })
})
