import { describe, it, expect } from 'vitest'
import { getLabwareName } from '../../utils'

describe('getLabwareName', () => {
  const testCases: Array<{ values: any; plural: boolean; expected: string }> = [
    { values: { labwareType: 'tipRack' }, plural: false, expected: 'tip' },
    { values: { labwareType: 'tipRack' }, plural: true, expected: 'tips' },
    {
      values: {
        labwareType: 'aluminumBlock',
        aluminumBlockType: '24well',
        aluminumBlockChildType: 'tubes', // user can select this if switching from 96 well to 24 well
      },
      plural: true,
      expected: 'wells',
    },
    {
      values: {
        labwareType: 'aluminumBlock',
        aluminumBlockType: '24well',
        aluminumBlockChildType: 'tubes', // user can select this if switching from 96 well to 24 well
      },
      plural: false,
      expected: 'well',
    },
    {
      values: {
        labwareType: 'aluminumBlock',
        aluminumBlockType: '96well',
        aluminumBlockChildType: 'tubes',
      },
      plural: true,
      expected: 'tubes',
    },
    {
      values: {
        labwareType: 'aluminumBlock',
        aluminumBlockType: '96well',
        aluminumBlockChildType: 'tubes',
      },
      plural: false,
      expected: 'tube',
    },
    {
      values: {
        labwareType: 'aluminumBlock',
        aluminumBlockType: '96well',
        aluminumBlockChildType: 'pcrTubeStrip',
      },
      plural: false,
      expected: 'tube',
    },
    {
      values: {
        labwareType: 'aluminumBlock',
        aluminumBlockType: '96well',
        aluminumBlockChildType: 'pcrTubeStrip',
      },
      plural: true,
      expected: 'tubes',
    },
    {
      values: {
        labwareType: 'aluminumBlock',
        aluminumBlockType: '96well',
        aluminumBlockChildType: 'pcrPlate',
      },
      plural: false,
      expected: 'well',
    },
    {
      values: {
        labwareType: 'aluminumBlock',
        aluminumBlockType: '96well',
        aluminumBlockChildType: 'pcrPlate',
      },
      plural: true,
      expected: 'wells',
    },
    { values: { labwareType: 'tubeRack' }, plural: false, expected: 'tube' },
    { values: { labwareType: 'tubeRack' }, plural: true, expected: 'tubes' },
    { values: { labwareType: 'wellPlate' }, plural: false, expected: 'well' },
    { values: { labwareType: 'wellPlate' }, plural: true, expected: 'wells' },
    { values: { labwareType: 'reservoir' }, plural: false, expected: 'well' },
    { values: { labwareType: 'reservoir' }, plural: true, expected: 'wells' },
  ]

  testCases.forEach(({ values, plural, expected }) => {
    it(`should return ${expected} for values=${JSON.stringify(
      values
    )} and plural=${String(plural)}`, () => {
      expect(getLabwareName(values, plural)).toEqual(expected)
    })
  })
})
