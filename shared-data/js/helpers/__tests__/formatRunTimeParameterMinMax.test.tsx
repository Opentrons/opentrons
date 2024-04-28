import { describe, it, expect } from 'vitest'
import { formatRunTimeParameterMinMax } from '../formatRunTimeParameterMinMax'

import type { RunTimeParameter } from '../../types'

describe('utils-formatRunTimeParameterMinMax', () => {
  it('should return int min and max', () => {
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
    const result = formatRunTimeParameterMinMax(mockData)
    expect(result).toEqual('1-10')
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
    const result = formatRunTimeParameterMinMax(mockData)
    expect(result).toEqual('1.5-10.0')
  })
})
