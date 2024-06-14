import { describe, it, expect } from 'vitest'
import { sortRuntimeParameters } from '../sortRunTimeParameters'

import type { CsvFileParameter, RunTimeParameter } from '../..'

const mockRunTimeParameters: RunTimeParameter[] = [
  {
    displayName: 'Dry Run',
    value: false,
    variableName: 'DRYRUN',
    description: 'Is this a dry or wet run? Wet is true, dry is false',
    type: 'bool',
    default: false,
  },
  {
    value: 4,
    displayName: 'Columns of Samples',
    variableName: 'COLUMNS',
    description: 'How many columns do you want?',
    type: 'int',
    min: 1,
    max: 14,
    default: 4,
  },
  {
    value: 6.5,
    displayName: 'EtoH Volume',
    variableName: 'ETOH_VOLUME',
    description: '70% ethanol volume',
    type: 'float',
    suffix: 'mL',
    min: 1.5,
    max: 10.0,
    default: 6.5,
  },
  {
    value: 'none',
    displayName: 'Default Module Offsets',
    variableName: 'DEFAULT_OFFSETS',
    description: 'default module offsets for temp, H-S, and none',
    type: 'str',
    choices: [
      {
        displayName: 'No offsets',
        value: 'none',
      },
      {
        displayName: 'temp offset',
        value: '1',
      },
      {
        displayName: 'heater-shaker offset',
        value: '2',
      },
    ],
    default: 'none',
  },
]

const mockCsvFileParameter: CsvFileParameter = {
  file: { id: 'test', file: { name: 'mock.csv' } as File },
  displayName: 'My CSV File',
  variableName: 'CSVFILE',
  description: 'CSV File for a protocol',
  type: 'csv_file' as const,
}

describe('sortRuntimeParameters', () => {
  it('should the first element is csv if runtime parameters include type csv', () => {
    const result = sortRuntimeParameters([
      ...mockRunTimeParameters,
      mockCsvFileParameter,
    ])
    expect(result[0]).toEqual(mockCsvFileParameter)
  })

  it('should the first element is the mock data first item if runtime parameters do not include type csv', () => {
    const result = sortRuntimeParameters(mockRunTimeParameters)
    expect(result[0]).toEqual(mockRunTimeParameters[0])
  })
})
