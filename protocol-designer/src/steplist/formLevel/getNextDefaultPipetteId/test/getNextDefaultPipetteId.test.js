// @flow
import { getNextDefaultPipetteId } from '../'

describe('getNextDefaultPipetteId', () => {
  describe('no previous forms', () => {
    const testCases = [
      {
        testMsg: 'both pipettes present: use left pipette',
        equippedPipettesById: {
          leftId: { id: 'leftId', mount: 'left' },
          rightId: { id: 'rightId', mount: 'right' },
        },
        expected: 'leftId',
      },
      {
        testMsg: 'right only: use right',
        equippedPipettesById: { rightId: { id: 'rightId', mount: 'right' } },
        expected: 'rightId',
      },
    ]

    testCases.forEach(({ testMsg, equippedPipettesById, expected }) => {
      it(testMsg, () => {
        const savedForms = {}
        const orderedStepIds = []

        const result = getNextDefaultPipetteId(
          savedForms,
          orderedStepIds,
          equippedPipettesById
        )

        expect(result).toBe(expected)
      })
    })
  })

  describe('with previous forms', () => {
    const testCases = [
      {
        testMsg: 'last used pipette',
        orderedStepIds: ['a', 'a', 'b'],
        expected: 'pipetteId_B',
      },
      {
        testMsg: 'no previous forms use pipettes',
        orderedStepIds: ['x', 'x', 'x'],
        expected: 'defaultId',
      },
      {
        testMsg: 'mix of steps with and without pipettes',
        orderedStepIds: ['x', 'a', 'x'],
        expected: 'pipetteId_A',
      },
      {
        testMsg: 'missing steps (no key in savedForms)',
        orderedStepIds: ['missingStep', 'a', 'missingStep', 'b', 'missingStep'],
        expected: 'pipetteId_B',
      },
      {
        testMsg: 'only missing steps',
        orderedStepIds: ['missingStep', 'missingStep'],
        expected: 'defaultId',
      },
    ]

    testCases.forEach(({ testMsg, orderedStepIds, expected }) => {
      it(testMsg, () => {
        const savedForms = {
          a: { pipette: 'pipetteId_A' },
          b: { pipette: 'pipetteId_B' },
          x: {}, // no 'pipette' key, eg a Pause step
        }

        const equippedPipettesById = {
          defaultId: { id: 'defaultId', mount: 'left' },
        }

        const result = getNextDefaultPipetteId(
          savedForms,
          orderedStepIds,
          equippedPipettesById
        )

        expect(result).toBe(expected)
      })
    })
  })
})
