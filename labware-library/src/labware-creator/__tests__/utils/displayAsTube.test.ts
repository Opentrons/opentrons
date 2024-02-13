import { describe, it, expect } from 'vitest'
import { displayAsTube } from '../../utils/displayAsTube'

describe('displayAsTube', () => {
  const testCases: Array<{ values: any; expected: boolean }> = [
    { values: { labwareType: 'tubeRack' }, expected: true },
    { values: { labwareType: 'wellPlate' }, expected: false },
    { values: { labwareType: 'tipRack' }, expected: false },
    { values: { labwareType: 'reservoir' }, expected: false },

    {
      values: {
        labwareType: 'aluminumBlock',
        aluminumBlockType: '24well',
        aluminumBlockChildType: 'tubes', // user can select this if switching from 96 well to 24 well
      },
      expected: false,
    },
    {
      values: {
        labwareType: 'aluminumBlock',
        aluminumBlockType: '96well',
        aluminumBlockChildType: 'tubes',
      },
      expected: true,
    },
    {
      values: {
        labwareType: 'aluminumBlock',
        aluminumBlockType: '96well',
        aluminumBlockChildType: 'pcrTubeStrip',
      },
      expected: true,
    },
    {
      values: {
        labwareType: 'aluminumBlock',
        aluminumBlockType: '96well',
        aluminumBlockChildType: 'pcrPlate',
      },
      expected: false,
    },
  ]

  testCases.forEach(({ values, expected }) => {
    it(`should return ${String(expected)} for values=${JSON.stringify(
      values
    )}`, () => {
      expect(displayAsTube(values)).toEqual(expected)
    })
  })
})
