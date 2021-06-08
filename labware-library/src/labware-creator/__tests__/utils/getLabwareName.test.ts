import { getLabwareName } from '../../utils'

describe('getLabwareName', () => {
  const testCases: Array<{ values: any; plural: boolean; expected: String }> = [
    { values: { labwareType: 'tipRack' }, plural: false, expected: 'tip' },
    { values: { labwareType: 'tipRack' }, plural: true, expected: 'tips' },
    {
      values: { labwareType: 'aluminumBlock' },
      plural: false,
      expected: 'tube',
    },
    {
      values: { labwareType: 'aluminumBlock' },
      plural: true,
      expected: 'tubes',
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
