// volume helpers tests

import * as helpers from '..'

describe('volume helpers', () => {
  const SPECS = [
    {
      name: 'getDisplayVolume outputs µL string by default',
      func: helpers.getDisplayVolume,
      input: [380],
      expected: '380',
    },
    {
      name: 'getDisplayVolume converts to mL',
      func: helpers.getDisplayVolume,
      input: [4200, 'mL'],
      expected: '4.2',
    },
    {
      name: 'getDisplayVolume converts to L',
      func: helpers.getDisplayVolume,
      input: [800000, 'L'],
      expected: '0.8',
    },
    {
      name: 'getDisplayVolume can round to fixed digits',
      func: helpers.getDisplayVolume,
      input: [123456789, 'L', 3],
      expected: '123.457',
    },
    {
      name: 'getAsciiVolumeUnits converts µL to uL',
      func: helpers.getAsciiVolumeUnits,
      input: ['µL'],
      expected: 'uL',
    },
    {
      name: 'getAsciiVolumeUnits leaves mL alone',
      func: helpers.getAsciiVolumeUnits,
      input: ['mL'],
      expected: 'mL',
    },
    {
      name: 'getAsciiVolumeUnits leaves L alone',
      func: helpers.getAsciiVolumeUnits,
      input: ['L'],
      expected: 'L',
    },
    {
      name: 'ensureVolumeUnits converts undefined to µL',
      func: helpers.ensureVolumeUnits,
      input: [undefined],
      expected: 'µL',
    },
    {
      name: 'ensureVolumeUnits converts uL to µL',
      func: helpers.ensureVolumeUnits,
      input: ['uL'],
      expected: 'µL',
    },
    {
      name: 'ensureVolumeUnits leaves mL alone',
      func: helpers.ensureVolumeUnits,
      input: ['mL'],
      expected: 'mL',
    },
    {
      name: 'ensureVolumeUnits leaves L alone',
      func: helpers.ensureVolumeUnits,
      input: ['L'],
      expected: 'L',
    },
    {
      name: 'ensureVolumeUnits converts ml to mL',
      func: helpers.ensureVolumeUnits,
      input: ['ml'],
      expected: 'mL',
    },
    {
      name: 'ensureVolumeUnits leaves l to L',
      func: helpers.ensureVolumeUnits,
      input: ['l'],
      expected: 'L',
    },
  ]

  SPECS.forEach(s => {
    it(s.name, () => expect(s.func(...s.input)).toEqual(s.expected))
  })
})
