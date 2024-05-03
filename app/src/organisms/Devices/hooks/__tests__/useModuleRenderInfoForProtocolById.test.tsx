import { renderHook } from '@testing-library/react'
import { vi, it, expect, describe, beforeEach } from 'vitest'
import { when } from 'vitest-when'

import {
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V2,
  TEMPERATURE_MODULE_V2_FIXTURE,
  heater_shaker_commands_with_results_key,
} from '@opentrons/shared-data'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'

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
import { useNotifyDeckConfigurationQuery } from '../../../../resources/deck_configuration'

import type {
  CutoutConfig,
  DeckConfiguration,
  ModuleModel,
  ModuleType,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { UseQueryResult } from 'react-query'
import type { AttachedModule } from '../../../../redux/modules/types'

vi.mock('../../ProtocolRun/utils/getProtocolModulesInfo')
vi.mock('../useAttachedModules')
vi.mock('../useStoredProtocolAnalysis')
vi.mock('../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
vi.mock('../../../../resources/deck_configuration')

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

const mockAttachedTempMod: AttachedModule = {
  id: 'temp_mod_1',
  moduleModel: TEMPERATURE_MODULE_V2,
  moduleType: TEMPERATURE_MODULE_TYPE,
  serialNumber: 'abc123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    currentTemperature: 40,
    targetTemperature: null,
    status: 'idle',
  },
  usbPort: {
    path: '/dev/ot_module_heatershaker0',
    port: 1,
    portGroup: 'unknown',
    hub: false,
  },
}

const mockTemperatureModuleDefinition = {
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
  cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
  opentronsModuleSerialNumber: 'abc123',
}

describe('useModuleRenderInfoForProtocolById hook', () => {
  beforeEach(() => {
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [mockCutoutConfig],
    } as UseQueryResult<DeckConfiguration>)
    vi.mocked(useAttachedModules).mockReturnValue([mockAttachedTempMod])
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
        conflictedFixture: null,
        attachedModuleMatch: mockTemperatureModuleGen2,
        ...TEMPERATURE_MODULE_INFO,
      },
    })
  })
})
