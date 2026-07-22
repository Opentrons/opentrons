import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useRunDataFileMetadata } from '@opentrons/react-api-client'

import { useRunFileCount } from '../useRunFileCount'

import type { KnownGoodRunData, LegacyGoodRunData } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')

const BASE_RUN: LegacyGoodRunData = {
  id: 'run-1',
  createdAt: '2024-01-01T00:00:00Z',
  current: false,
  status: 'succeeded',
  actions: [],
  errors: [],
  hasEverEnteredErrorRecovery: false,
  pipettes: [],
  labware: [],
  liquids: [],
  modules: [],
}

const KNOWN_GOOD_RUN: KnownGoodRunData = {
  ...BASE_RUN,
  ok: true,
  runTimeParameters: [],
  outputFileIds: [],
}

function mockOutputDataFiles(count: number): void {
  vi.mocked(useRunDataFileMetadata).mockReturnValue({
    data: {
      data: Array.from({ length: count }, (_, i) => ({ id: `file-${i}` })),
    },
  } as any)
}

describe('useRunFileCount', () => {
  it('returns 3 for a legacy run with no output data files', () => {
    mockOutputDataFiles(0)
    const { result } = renderHook(() => useRunFileCount(BASE_RUN))
    // protocol + labware offsets + run log
    expect(result.current).toBe(3)
  })

  it('returns 3 for a KnownGoodRun with no RTPs and no output data files', () => {
    mockOutputDataFiles(0)
    const { result } = renderHook(() => useRunFileCount(KNOWN_GOOD_RUN))
    expect(result.current).toBe(3)
  })

  it('counts output data files', () => {
    mockOutputDataFiles(2)
    const { result } = renderHook(() => useRunFileCount(KNOWN_GOOD_RUN))
    expect(result.current).toBe(5)
  })

  it('counts csv_file RTPs', () => {
    mockOutputDataFiles(0)
    const run: KnownGoodRunData = {
      ...KNOWN_GOOD_RUN,
      runTimeParameters: [
        {
          type: 'csv_file',
          variableName: 'data',
          displayName: 'Data',
          description: '',
          file: null,
        },
        {
          type: 'int',
          variableName: 'vol',
          displayName: 'Volume',
          description: '',
          value: 10,
          default: 10,
          min: 0,
          max: 100,
        },
      ],
    } as any
    const { result } = renderHook(() => useRunFileCount(run))
    // 3 base + 1 csv_file RTP
    expect(result.current).toBe(4)
  })

  it('sums output data files and RTPs together', () => {
    mockOutputDataFiles(3)
    const run: KnownGoodRunData = {
      ...KNOWN_GOOD_RUN,
      runTimeParameters: [
        {
          type: 'csv_file',
          variableName: 'csv1',
          displayName: 'CSV 1',
          description: '',
          file: null,
        },
        {
          type: 'csv_file',
          variableName: 'csv2',
          displayName: 'CSV 2',
          description: '',
          file: null,
        },
      ],
    } as any
    const { result } = renderHook(() => useRunFileCount(run))
    // 3 base + 3 output data files + 2 csv RTPs = 8
    expect(result.current).toBe(8)
  })

  it('does not count non-csv RTPs', () => {
    mockOutputDataFiles(0)
    const run: KnownGoodRunData = {
      ...KNOWN_GOOD_RUN,
      runTimeParameters: [
        {
          type: 'int',
          variableName: 'vol',
          displayName: 'Volume',
          description: '',
          value: 5,
          default: 5,
          min: 0,
          max: 10,
        },
        {
          type: 'float',
          variableName: 'speed',
          displayName: 'Speed',
          description: '',
          value: 1.0,
          default: 1.0,
          min: 0.1,
          max: 5.0,
        },
        {
          type: 'bool',
          variableName: 'dry',
          displayName: 'Dry Run',
          description: '',
          value: false,
          default: false,
        },
        {
          type: 'str',
          variableName: 'label',
          displayName: 'Label',
          description: '',
          value: 'A',
          default: 'A',
          choices: [{ displayName: 'A', value: 'A' }],
        },
      ],
    } as any
    const { result } = renderHook(() => useRunFileCount(run))
    expect(result.current).toBe(3)
  })

  it('handles undefined runDataFilesData gracefully (query loading)', () => {
    vi.mocked(useRunDataFileMetadata).mockReturnValue({ data: undefined } as any)
    const { result } = renderHook(() => useRunFileCount(KNOWN_GOOD_RUN))
    expect(result.current).toBe(3)
  })

  it('does not count RTPs for a LegacyGoodRunData (no ok field)', () => {
    mockOutputDataFiles(1)
    // LegacyGoodRunData has no runTimeParameters
    const { result } = renderHook(() => useRunFileCount(BASE_RUN))
    // 3 base + 1 output data file = 4
    expect(result.current).toBe(4)
  })
})
