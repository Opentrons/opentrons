import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import {
  mockPipetteData1Channel,
  mockPipetteData8Channel,
} from '/app/resources/instruments/__fixtures__'
import { useIsOEMMode } from '/app/resources/robot-settings'

import { v6WithTwoPipettes as _uncastedModifiedSimpleV6Protocol } from '../__fixtures__'
import { useMostRecentCompletedAnalysis } from '../useMostRecentCompletedAnalysis'
import { useRunPipetteInfoByMount } from '../useRunPipetteInfoByMount'

import type * as SharedData from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')
vi.mock('../useMostRecentCompletedAnalysis')
vi.mock('/app/resources/analysis')
vi.mock('/app/resources/robot-settings')

const simpleV6Compatible = {
  ..._uncastedModifiedSimpleV6Protocol,
  labware: [
    {
      id: ' trashId',
      displayName: 'Trash',
      definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
      loadName: 'opentrons_1_trash_1100ml_fixed',
    },
    {
      id: 'tipRackId',
      displayName: 'Opentrons OT-2 96 Tip Rack 10 µL',
      definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
      loadName: 'opentrons_96_tiprack_10ul',
    },
    {
      id: 'sourcePlateId',
      displayName: 'Source Plate',
      definitionUri: 'example/plate/1',
      loadName: 'plate',
    },
    {
      id: 'destPlateId',
      displayName: 'Sample Collection Plate',
      definitionUri: 'example/plate/1',
      loadName: 'plate',
    },
  ],
  pipettes: [
    {
      id: 'pipetteId',
      pipetteName: 'p1000_single_flex',
    },
    {
      id: 'pipetteId2',
      pipetteName: 'p1000_multi_flex',
    },
  ],
} as any as SharedData.ProtocolAnalysisOutput

const simpleV6Incompatible = {
  ..._uncastedModifiedSimpleV6Protocol,
  labware: [
    {
      id: ' trashId',
      displayName: 'Trash',
      definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
      loadName: 'opentrons_1_trash_1100ml_fixed',
    },
    {
      id: 'tipRackId',
      displayName: 'Opentrons OT-2 96 Tip Rack 10 µL',
      definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
      loadName: 'opentrons_96_tiprack_10ul',
    },
    {
      id: 'sourcePlateId',
      displayName: 'Source Plate',
      definitionUri: 'example/plate/1',
      loadName: 'plate',
    },
    {
      id: 'destPlateId',
      displayName: 'Sample Collection Plate',
      definitionUri: 'example/plate/1',
      loadName: 'plate',
    },
  ],
  pipettes: [
    {
      id: 'pipetteId',
      pipetteName: 'p1000_multi_flex',
    },
    {
      id: 'pipetteId2',
      pipetteName: 'p1000_multi_flex',
    },
  ],
} as any as SharedData.ProtocolAnalysisOutput

const PROTOCOL_DETAILS_COMPATIBLE = {
  displayName: 'fake protocol',
  protocolData: simpleV6Compatible,
  protocolKey: 'fakeProtocolKey',
  robotType: 'Flex Standard' as const,
}

const PROTOCOL_DETAILS_INCOMPATIBLE = {
  displayName: 'fake protocol',
  protocolData: simpleV6Incompatible,
  protocolKey: 'fakeProtocolKey',
  robotType: 'Flex Standard' as const,
}

describe('useRunPipetteInfoByMount hook', () => {
  beforeEach(() => {
    when(vi.mocked(useIsOEMMode)).calledWith().thenReturn(false)
    when(vi.mocked(useInstrumentsQuery))
      .calledWith()
      .thenReturn({
        data: {
          data: [mockPipetteData1Channel, mockPipetteData8Channel],
          meta: {} as any,
        },
        isSuccess: true,
        status: 'success',
      } as any)
  })

  it('should return empty mounts when protocol details not found', () => {
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith('1')
      .thenReturn(null)
    when(vi.mocked(useStoredProtocolAnalysis)).calledWith('1').thenReturn(null)
    const { result } = renderHook(() => useRunPipetteInfoByMount('1'))
    expect(result.current).toStrictEqual({
      left: null,
      right: null,
    })
  })

  it('should return run pipette info by mount for matches', () => {
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith('1')
      .thenReturn(PROTOCOL_DETAILS_COMPATIBLE.protocolData as any)
    when(vi.mocked(useStoredProtocolAnalysis))
      .calledWith('1')
      .thenReturn(
        PROTOCOL_DETAILS_COMPATIBLE as any as SharedData.ProtocolAnalysisOutput
      )
    const { result } = renderHook(() => useRunPipetteInfoByMount('1'))
    expect(result.current).toStrictEqual({
      left: {
        requestedPipetteMatch: 'match',
      },
      right: {
        requestedPipetteMatch: 'match',
      },
    })
  })
  it('should return run pipette info by mount for non matches', () => {
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith('1')
      .thenReturn(PROTOCOL_DETAILS_INCOMPATIBLE.protocolData as any)
    when(vi.mocked(useStoredProtocolAnalysis))
      .calledWith('1')
      .thenReturn(
        PROTOCOL_DETAILS_INCOMPATIBLE as any as SharedData.ProtocolAnalysisOutput
      )
    const { result } = renderHook(() => useRunPipetteInfoByMount('1'))
    expect(result.current).toStrictEqual({
      left: {
        requestedPipetteMatch: 'incompatible',
      },
      right: {
        requestedPipetteMatch: 'match',
      },
    })
  })
})
