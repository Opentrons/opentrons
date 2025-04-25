import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { getActivePipetteId } from '/app/organisms/LabwarePositionCheck/LPCFlows/hooks/utils'

import { getUniqueValidLwLocationInfoByAnalysis } from '..'
import { getLPCUniqValidLabwareLocationInfo } from '../getLPCUniqValidLabwareLocationInfo'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

vi.mock('/app/organisms/LabwarePositionCheck/LPCFlows/hooks/utils')
vi.mock('../getLPCUniqValidLabwareLocationInfo')

describe('getUniqueValidLwLocationInfoByAnalysis', () => {
  const ACTIVE_PIPETTE_ID = 'pipette-123'
  const MOCK_LW_LOCATION_INFOS = [
    { definitionUri: 'labware-1', labwareId: 'lw-1' },
    { definitionUri: 'labware-2', labwareId: 'lw-2' },
  ]
  const MOCK_PROTOCOL_DATA = {
    pipettes: [{ id: ACTIVE_PIPETTE_ID, mount: 'left' }],
  } as CompletedProtocolAnalysis
  const MOCK_LABWARE_DEFS = [{ metadata: { displayName: 'Labware 1' } }] as any

  beforeEach(() => {
    vi.mocked(getActivePipetteId).mockReturnValue(ACTIVE_PIPETTE_ID)
    vi.mocked(getLPCUniqValidLabwareLocationInfo).mockReturnValue(
      MOCK_LW_LOCATION_INFOS as any
    )
  })

  it('should return empty array when protocolData is null', () => {
    const result = getUniqueValidLwLocationInfoByAnalysis({
      protocolData: null,
      labwareDefs: MOCK_LABWARE_DEFS,
      robotType: FLEX_ROBOT_TYPE,
    })

    expect(result).toEqual([])
    expect(getLPCUniqValidLabwareLocationInfo).not.toHaveBeenCalled()
  })

  it('should return empty array when labwareDefs is null', () => {
    const result = getUniqueValidLwLocationInfoByAnalysis({
      protocolData: MOCK_PROTOCOL_DATA,
      labwareDefs: null,
      robotType: FLEX_ROBOT_TYPE,
    })

    expect(result).toEqual([])
    expect(getLPCUniqValidLabwareLocationInfo).not.toHaveBeenCalled()
  })

  it('should return empty array when activePipetteId is null', () => {
    vi.mocked(getActivePipetteId).mockReturnValue(null)

    const result = getUniqueValidLwLocationInfoByAnalysis({
      protocolData: MOCK_PROTOCOL_DATA,
      labwareDefs: MOCK_LABWARE_DEFS,
      robotType: FLEX_ROBOT_TYPE,
    })

    expect(result).toEqual([])
    expect(getLPCUniqValidLabwareLocationInfo).not.toHaveBeenCalled()
  })

  it('should return empty array when robotType is not FLEX_ROBOT_TYPE', () => {
    const result = getUniqueValidLwLocationInfoByAnalysis({
      protocolData: MOCK_PROTOCOL_DATA,
      labwareDefs: MOCK_LABWARE_DEFS,
      robotType: OT2_ROBOT_TYPE,
    })

    expect(result).toEqual([])
    expect(getLPCUniqValidLabwareLocationInfo).not.toHaveBeenCalled()
  })

  it('should return result from getLPCUniqValidLabwareLocationInfo when all conditions are met', () => {
    const result = getUniqueValidLwLocationInfoByAnalysis({
      protocolData: MOCK_PROTOCOL_DATA,
      labwareDefs: MOCK_LABWARE_DEFS,
      robotType: FLEX_ROBOT_TYPE,
    })

    expect(result).toEqual(MOCK_LW_LOCATION_INFOS)
    expect(getLPCUniqValidLabwareLocationInfo).toHaveBeenCalledWith(
      MOCK_PROTOCOL_DATA,
      MOCK_LABWARE_DEFS
    )
  })

  it('should pass empty array to getActivePipetteId when protocolData has no pipettes', () => {
    const protocolDataWithoutPipettes = {
      ...MOCK_PROTOCOL_DATA,
      pipettes: undefined,
    }

    getUniqueValidLwLocationInfoByAnalysis({
      protocolData: protocolDataWithoutPipettes,
      labwareDefs: MOCK_LABWARE_DEFS,
      robotType: FLEX_ROBOT_TYPE,
    } as any)

    expect(getActivePipetteId).toHaveBeenCalledWith([])
  })
})
