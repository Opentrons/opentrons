import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { useNotifySearchLabwareOffsets } from '/app/resources/labware_offsets'
import { useNotifyRunQuery } from '/app/resources/runs'

import { useLPCLabwareInfo } from '..'
import { getLPCLabwareInfoFrom } from '../getLPCLabwareInfoFrom'
import { getLPCSearchParams } from '../getLPCSearchParams'
import { getUniqueValidLwLocationInfoByAnalysis } from '../getUniqueValidLwLocationInfoByAnalysis'

vi.mock('../getUniqueValidLwLocationInfoByAnalysis')
vi.mock('../getLPCLabwareInfoFrom')
vi.mock('../getLPCSearchParams')
vi.mock('/app/resources/labware_offsets')
vi.mock('/app/resources/runs')

const runningRun = {
  current: false,
  id: 'test_id_running',
  status: RUN_STATUS_RUNNING,
}

describe('useLPCLabwareInfo', () => {
  const RUN_ID = 'run-123'
  const PROTOCOL_DATA = { commands: [] } as any
  const LABWARE_DEFS = [{ uri: 'labware-1' }] as any
  const MOCK_LW_LOCATION_COMBOS = [{ definitionUri: 'labware-uri-1' }] as any
  const MOCK_SEARCH_PARAMS = {
    filters: [{ definitionUri: 'labware-uri-1' }],
  } as any
  const MOCK_STORED_OFFSETS = [{ id: 'offset-1' }] as any
  const MOCK_LEGACY_OFFSETS = [{ id: 'legacy-offset-1' }] as any
  const MOCK_LABWARE_INFO = { areOffsetsApplied: true } as any

  beforeEach(() => {
    vi.mocked(getUniqueValidLwLocationInfoByAnalysis).mockReturnValue(
      MOCK_LW_LOCATION_COMBOS
    )
    vi.mocked(getLPCSearchParams).mockReturnValue(MOCK_SEARCH_PARAMS)
    vi.mocked(getLPCLabwareInfoFrom).mockReturnValue(MOCK_LABWARE_INFO)

    vi.mocked(useNotifySearchLabwareOffsets).mockReturnValue({
      data: { data: MOCK_STORED_OFFSETS },
    } as any)
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: { labwareOffsets: MOCK_LEGACY_OFFSETS, status: RUN_STATUS_IDLE },
      },
    } as any)
  })

  it('should return data from both OT2 and Flex hooks for Flex robot type', () => {
    const { result } = renderHook(() => {
      return useLPCLabwareInfo({
        runId: RUN_ID,
        robotType: FLEX_ROBOT_TYPE,
        labwareDefs: LABWARE_DEFS,
        protocolData: PROTOCOL_DATA,
      })
    })

    expect(result.current).toEqual({
      labwareInfo: MOCK_LABWARE_INFO,
      storedOffsets: MOCK_STORED_OFFSETS,
      legacyOffsets: MOCK_LEGACY_OFFSETS,
    })

    expect(getUniqueValidLwLocationInfoByAnalysis).toHaveBeenCalledWith({
      labwareDefs: LABWARE_DEFS,
      protocolData: PROTOCOL_DATA,
      robotType: FLEX_ROBOT_TYPE,
    })
    expect(getLPCSearchParams).toHaveBeenCalledWith(MOCK_LW_LOCATION_COMBOS)
    expect(useNotifySearchLabwareOffsets).toHaveBeenCalledWith(
      MOCK_SEARCH_PARAMS,
      {
        enabled: true,
        refetchInterval: 5000,
      }
    )
    expect(getLPCLabwareInfoFrom).toHaveBeenCalledWith({
      currentOffsets: MOCK_STORED_OFFSETS,
      lwLocInfo: MOCK_LW_LOCATION_COMBOS,
      labwareDefs: LABWARE_DEFS,
      protocolData: PROTOCOL_DATA,
    })
  })

  it('should return data from both OT2 and Flex hooks for OT-2 robot type', () => {
    const { result } = renderHook(() => {
      return useLPCLabwareInfo({
        runId: RUN_ID,
        robotType: OT2_ROBOT_TYPE,
        labwareDefs: LABWARE_DEFS,
        protocolData: PROTOCOL_DATA,
      })
    })

    expect(result.current).toEqual({
      labwareInfo: MOCK_LABWARE_INFO,
      storedOffsets: MOCK_STORED_OFFSETS,
      legacyOffsets: MOCK_LEGACY_OFFSETS,
    })

    expect(useNotifyRunQuery).toHaveBeenCalledWith(RUN_ID, {
      enabled: true,
    })
  })

  it('should handle null runId', () => {
    const { result } = renderHook(() => {
      return useLPCLabwareInfo({
        runId: null,
        robotType: FLEX_ROBOT_TYPE,
        labwareDefs: LABWARE_DEFS,
        protocolData: PROTOCOL_DATA,
      })
    })

    expect(result.current).toEqual({
      labwareInfo: MOCK_LABWARE_INFO,
      storedOffsets: MOCK_STORED_OFFSETS,
      legacyOffsets: MOCK_LEGACY_OFFSETS,
    })

    expect(useNotifyRunQuery).toHaveBeenCalledWith(null, {
      enabled: false,
    })
  })

  it('should not enable offset search if run status is not idle', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith('test_id_running')
      .thenReturn({
        data: { data: { status: runningRun } },
      } as any)

    const { result } = renderHook(() => {
      return useLPCLabwareInfo({
        runId: RUN_ID,
        robotType: FLEX_ROBOT_TYPE,
        labwareDefs: LABWARE_DEFS,
        protocolData: PROTOCOL_DATA,
      })
    })

    expect(result.current).toEqual({
      labwareInfo: MOCK_LABWARE_INFO,
      storedOffsets: MOCK_STORED_OFFSETS,
      legacyOffsets: MOCK_LEGACY_OFFSETS,
    })

    expect(useNotifySearchLabwareOffsets).toHaveBeenCalledWith(
      MOCK_SEARCH_PARAMS,
      {
        enabled: false,
        refetchInterval: 5000,
      }
    )
  })

  it('should handle undefined stored offsets', () => {
    vi.mocked(useNotifySearchLabwareOffsets).mockReturnValue({
      data: undefined,
    } as any)

    const { result } = renderHook(() => {
      return useLPCLabwareInfo({
        runId: RUN_ID,
        robotType: FLEX_ROBOT_TYPE,
        labwareDefs: LABWARE_DEFS,
        protocolData: PROTOCOL_DATA,
      })
    })

    expect(result.current.storedOffsets).toBeUndefined()
    expect(getLPCLabwareInfoFrom).toHaveBeenCalledWith({
      currentOffsets: undefined,
      lwLocInfo: MOCK_LW_LOCATION_COMBOS,
      labwareDefs: LABWARE_DEFS,
      protocolData: PROTOCOL_DATA,
    })
  })

  it('should handle undefined run record', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: undefined,
    } as any)

    const { result } = renderHook(() => {
      return useLPCLabwareInfo({
        runId: RUN_ID,
        robotType: OT2_ROBOT_TYPE,
        labwareDefs: LABWARE_DEFS,
        protocolData: PROTOCOL_DATA,
      })
    })

    expect(result.current.legacyOffsets).toEqual([])
  })

  it('should handle empty stored offsets', () => {
    vi.mocked(useNotifySearchLabwareOffsets).mockReturnValue({
      data: undefined,
    } as any)

    vi.mocked(getUniqueValidLwLocationInfoByAnalysis).mockReturnValue([])
    vi.mocked(getLPCSearchParams).mockReturnValue({ filters: [] })

    const { result } = renderHook(() => {
      return useLPCLabwareInfo({
        runId: RUN_ID,
        robotType: FLEX_ROBOT_TYPE,
        labwareDefs: LABWARE_DEFS,
        protocolData: PROTOCOL_DATA,
      })
    })

    expect(result.current.storedOffsets).toEqual([])
    expect(getLPCLabwareInfoFrom).toHaveBeenCalledWith({
      currentOffsets: [],
      lwLocInfo: [],
      labwareDefs: LABWARE_DEFS,
      protocolData: PROTOCOL_DATA,
    })
  })
})
