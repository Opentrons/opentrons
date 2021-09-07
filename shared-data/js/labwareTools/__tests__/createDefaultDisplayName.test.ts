import { createDefaultDisplayName } from '..'

import type { RegularNameProps } from '..'

interface TestCase {
  testName: string
  args: RegularNameProps
  expected: string
}

describe('createDefaultDisplayName', () => {
  const testCases: TestCase[] = [
    {
      testName: 'handle the minimal case',
      args: {
        displayCategory: 'wellPlate',
        displayVolumeUnits: 'µL',
        gridRows: 2,
        gridColumns: 3,
        totalLiquidVolume: 123,
      },
      expected: 'Generic 6 Well Plate 123 µL',
    },
    {
      testName: 'handle a decimal in volume',
      args: {
        displayCategory: 'wellPlate',
        displayVolumeUnits: 'µL',
        gridRows: 2,
        gridColumns: 3,
        totalLiquidVolume: 12.3,
      },
      expected: 'Generic 6 Well Plate 12.3 µL',
    },
    {
      testName: 'calculate wells = rows x cols',
      args: {
        displayCategory: 'wellPlate',
        displayVolumeUnits: 'µL',
        gridRows: 8,
        gridColumns: 10,
        totalLiquidVolume: 123,
      },
      expected: 'Generic 80 Well Plate 123 µL',
    },
    {
      testName: 'handle tube rack (example of a different displayCategory)',
      args: {
        displayCategory: 'tubeRack',
        displayVolumeUnits: 'µL',
        gridRows: 2,
        gridColumns: 3,
        totalLiquidVolume: 123,
      },
      expected: 'Generic 6 Tube Rack 123 µL',
    },
    {
      testName: 'append loadNamePostfix',
      args: {
        displayCategory: 'wellPlate',
        displayVolumeUnits: 'µL',
        gridRows: 2,
        gridColumns: 3,
        totalLiquidVolume: 123,
        loadNamePostfix: ['spam  ', ' blah', 'PCR'],
      },
      expected: 'Generic 6 Well Plate 123 µL Spam Blah PCR',
    },
    {
      testName: 'support brand name when specified (ignore extra whitespace)',
      args: {
        displayCategory: 'wellPlate',
        displayVolumeUnits: 'µL',
        gridRows: 2,
        gridColumns: 3,
        totalLiquidVolume: 123,
        brandName: ' cool  brand ',
      },
      expected: 'Cool Brand 6 Well Plate 123 µL',
    },
    {
      testName: 'support brand name when specified (capitalization)',
      args: {
        displayCategory: 'wellPlate',
        displayVolumeUnits: 'µL',
        gridRows: 2,
        gridColumns: 3,
        totalLiquidVolume: 123,
        brandName: ' BIO tech',
      },
      expected: 'BIO Tech 6 Well Plate 123 µL',
    },
    {
      testName: 'support mL when specified (volume number always in µL!)',
      args: {
        displayCategory: 'wellPlate',
        displayVolumeUnits: 'mL',
        gridRows: 2,
        gridColumns: 3,
        totalLiquidVolume: 123,
      },
      expected: 'Generic 6 Well Plate 0.123 mL',
    },
  ]

  testCases.forEach(({ testName, args, expected }) => {
    it(`should ${testName}`, () => {
      expect(createDefaultDisplayName(args)).toEqual(expected)
    })
  })
})
