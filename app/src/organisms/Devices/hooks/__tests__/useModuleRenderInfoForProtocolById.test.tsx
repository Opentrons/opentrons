import { renderHook } from '@testing-library/react'
import { vi, it, expect, describe, beforeEach } from 'vitest'
import { when } from 'vitest-when'
import { UseQueryResult } from 'react-query'

import {
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  heater_shaker_commands_with_results_key,
} from '@opentrons/shared-data'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useDeckConfigurationQuery } from '@opentrons/react-api-client'

import { getProtocolModulesInfo } from '../../ProtocolRun/utils/getProtocolModulesInfo'

import {
  mockTemperatureModuleGen2,
  mockThermocycler,
} from '../../../../redux/modules/__fixtures__'
import {
  useAttachedModules,
  useModuleRenderInfoForProtocolById,
  useStoredProtocolAnalysis,
} from '..'

import type {
  CutoutConfig,
  DeckConfiguration,
  ModuleModel,
  ModuleType,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')
vi.mock('../../ProtocolRun/utils/getProtocolModulesInfo')
vi.mock('../useAttachedModules')
vi.mock('../useStoredProtocolAnalysis')
vi.mock('../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')

const heaterShakerCommandsWithResultsKey = (heater_shaker_commands_with_results_key as unknown) as ProtocolAnalysisOutput

const PROTOCOL_DETAILS = {
  displayName: 'fake protocol',
  protocolData: {
    ...heaterShakerCommandsWithResultsKey,
    labware: [
      {
        displayName: 'Trash',
        definitionId: 'opentrons/opentrons_1_trash_3200ml_fixed/1',
      },
    ],
  },
  protocolKey: 'fakeProtocolKey',
}

const mockTemperatureModuleDefinition = {
  moduleId: 'someMagneticModule',
  model: 'temperatureModuleV2' as ModuleModel,
  type: 'temperatureModuleType' as ModuleType,
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
}

const TEMPERATURE_MODULE_INFO = {
  moduleId: 'temperatureModuleId',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: mockTemperatureModuleDefinition,
  nestedLabwareDef: null,
  nestedLabwareId: null,
  nestedLabwareDisplayName: null,
  protocolLoadOrder: 0,
  slotName: 'D1',
} as any

const mockCutoutConfig: CutoutConfig = {
  cutoutId: 'cutoutD1',
  cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
}

describe('useModuleRenderInfoForProtocolById hook', () => {
  beforeEach(() => {
    vi.mocked(useDeckConfigurationQuery).mockReturnValue({
      data: [mockCutoutConfig],
    } as UseQueryResult<DeckConfiguration>)
    vi.mocked(useAttachedModules).mockReturnValue([
      mockTemperatureModuleGen2,
      mockThermocycler,
    ])
    when(vi.mocked(useStoredProtocolAnalysis))
      .calledWith('1')
      .thenReturn((PROTOCOL_DETAILS as unknown) as ProtocolAnalysisOutput)
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith('1')
      .thenReturn(PROTOCOL_DETAILS.protocolData as any)
    vi.mocked(getProtocolModulesInfo).mockReturnValue([TEMPERATURE_MODULE_INFO])
  })

  it('should return no module render info when protocol details not found', () => {
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith('1')
      .thenReturn(null)
    when(vi.mocked(useStoredProtocolAnalysis)).calledWith('1').thenReturn(null)
    const { result } = renderHook(() =>
      useModuleRenderInfoForProtocolById('1', true)
    )
    expect(result.current).toStrictEqual({})
  })
  it('should return module render info', () => {
    const { result } = renderHook(() =>
      useModuleRenderInfoForProtocolById('1', true)
    )
    expect(result.current).toStrictEqual({
      temperatureModuleId: {
        conflictedFixture: mockCutoutConfig,
        attachedModuleMatch: mockTemperatureModuleGen2,
        ...TEMPERATURE_MODULE_INFO,
      },
    })
  })
})
