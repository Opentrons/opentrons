import { describe, it, expect, vi } from 'vitest'
import { formatRunTimeParameterValue } from '../formatRunTimeParameterValue'

import type { RunTimeParameter } from '../../types'

const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const mockTFunction = vi.fn(str => capitalizeFirstLetter(str))

describe('utils-formatRunTimeParameterDefaultValue', () => {
  it('should return value with suffix when type is int', () => {
    const mockData = {
      value: 6,
      displayName: 'PCR Cycles',
      variableName: 'PCR_CYCLES',
      description: 'number of PCR cycles on a thermocycler',
      type: 'int',
      min: 1,
      max: 10,
      default: 6,
    } as RunTimeParameter
    const result = formatRunTimeParameterValue(mockData, mockTFunction)
    expect(result).toEqual('6')
  })

  it('should return value with suffix when type is float', () => {
    const mockData = {
      value: 6.5,
      displayName: 'EtoH Volume',
      variableName: 'ETOH_VOLUME',
      description: '70% ethanol volume',
      type: 'float',
      suffix: 'mL',
      min: 1.5,
      max: 10.0,
      default: 6.5,
    } as RunTimeParameter
    const result = formatRunTimeParameterValue(mockData, mockTFunction)
    expect(result).toEqual('6.5 mL')
  })

  it('should return value when type is str', () => {
    const mockData = {
      value: 'left',
      displayName: 'pipette mount',
      variableName: 'mount',
      description: 'pipette mount',
      type: 'str',
      choices: [
        {
          displayName: 'Left',
          value: 'left',
        },
        {
          displayName: 'Right',
          value: 'right',
        },
      ],
      default: 'left',
    } as RunTimeParameter
    const result = formatRunTimeParameterValue(mockData, mockTFunction)
    expect(result).toEqual('Left')
  })

  it('should return value when type is int choice with suffix', () => {
    const mockData = {
      value: 5,
      displayName: 'num',
      variableName: 'number',
      description: 'its just number',
      type: 'int',
      suffix: 'mL',
      min: 1,
      max: 10,
      choices: [
        {
          displayName: 'one',
          value: 1,
        },
        {
          displayName: 'six',
          value: 6,
        },
      ],
      default: 5,
    } as RunTimeParameter
    const result = formatRunTimeParameterValue(mockData, mockTFunction)
    expect(result).toEqual('5 mL')
  })

  it('should return value when type is float choice with suffix', () => {
    const mockData = {
      value: 5.0,
      displayName: 'num',
      variableName: 'number',
      description: 'its just number',
      type: 'float',
      suffix: 'mL',
      min: 1.0,
      max: 10.0,
      choices: [
        {
          displayName: 'one',
          value: 1.0,
        },
        {
          displayName: 'six',
          value: 6.0,
        },
      ],
      default: 5.0,
    } as RunTimeParameter
    const result = formatRunTimeParameterValue(mockData, mockTFunction)
    expect(result).toEqual('5 mL')
  })

  it('should return value when type is boolean true', () => {
    const mockData = {
      value: true,
      displayName: 'Deactivate Temperatures',
      variableName: 'DEACTIVATE_TEMP',
      description: 'deactivate temperature on the module',
      type: 'bool',
      default: true,
    } as RunTimeParameter
    const result = formatRunTimeParameterValue(mockData, mockTFunction)
    expect(result).toEqual('On')
  })

  it('should return value when type is boolean false', () => {
    const mockData = {
      value: false,
      displayName: 'Dry Run',
      variableName: 'DRYRUN',
      description: 'Is this a dry or wet run? Wet is true, dry is false',
      type: 'bool',
      default: false,
    } as RunTimeParameter
    const result = formatRunTimeParameterValue(mockData, mockTFunction)
    expect(result).toEqual('Off')
  })

  it('should return value when type is csv', () => {
    const mockData = {
      file: { id: 'test', file: { name: 'mock.csv' } as File },
      displayName: 'My CSV File',
      variableName: 'CSVFILE',
      description: 'CSV File for a protocol',
      type: 'csv_file' as const,
    } as RunTimeParameter
    const result = formatRunTimeParameterValue(mockData, mockTFunction)
    expect(result).toEqual('mock.csv')
  })
})
