import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'

import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'

import { getProtocolModulesInfo } from '../../../../organisms/ProtocolSetup/utils/getProtocolModulesInfo'

import {
  mockMagneticModuleGen2,
  mockTemperatureModuleGen2,
  mockThermocycler,
} from '../../../../redux/modules/__fixtures__'
import {
  useAttachedModules,
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
} from '..'

import type { ModuleDefinition, ProtocolFile } from '@opentrons/shared-data'
import type { ProtocolDetails } from '..'

jest.mock('../../../../organisms/ProtocolSetup/utils/getProtocolModulesInfo')
jest.mock('../useAttachedModules')
jest.mock('../useProtocolDetailsForRun')

const mockGetProtocolModulesInfo = getProtocolModulesInfo as jest.MockedFunction<
  typeof getProtocolModulesInfo
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolFile<{}>

const PROTOCOL_DETAILS = {
  displayName: 'fake protocol',
  protocolData: simpleV6Protocol,
}

const MAGNETIC_MODULE_INFO = {
  moduleId: 'magneticModuleId',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: mockMagneticModuleGen2 as any,
  nestedLabwareDef: null,
  nestedLabwareId: null,
  nestedLabwareDisplayName: null,
  protocolLoadOrder: 0,
  slotName: '1',
}

const TEMPERATURE_MODULE_INFO = {
  moduleId: 'temperatureModuleId',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: (mockTemperatureModuleGen2 as unknown) as ModuleDefinition,
  nestedLabwareDef: null,
  nestedLabwareId: null,
  nestedLabwareDisplayName: null,
  protocolLoadOrder: 0,
  slotName: '1',
}

describe('useModuleRenderInfoForProtocolById hook', () => {
  beforeEach(() => {
    when(mockUseAttachedModules)
      .calledWith('otie')
      .mockReturnValue([
        mockMagneticModuleGen2,
        mockTemperatureModuleGen2,
        mockThermocycler,
      ])
    when(mockUseProtocolDetailsForRun)
      .calledWith('1')
      .mockReturnValue(PROTOCOL_DETAILS)
    when(mockGetProtocolModulesInfo)
      .calledWith(simpleV6Protocol, standardDeckDef as any)
      .mockReturnValue([TEMPERATURE_MODULE_INFO, MAGNETIC_MODULE_INFO])
  })

  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should return no module render info when protocol details not found', () => {
    when(mockUseProtocolDetailsForRun)
      .calledWith('1')
      .mockReturnValue({} as ProtocolDetails)
    const { result } = renderHook(() =>
      useModuleRenderInfoForProtocolById('otie', '1')
    )
    expect(result.current).toStrictEqual({})
  })
  it('should return module render info', () => {
    const { result } = renderHook(() =>
      useModuleRenderInfoForProtocolById('otie', '1')
    )
    expect(result.current).toStrictEqual({
      magneticModuleId: {
        attachedModuleMatch: mockMagneticModuleGen2,
        ...MAGNETIC_MODULE_INFO,
      },
      temperatureModuleId: {
        attachedModuleMatch: mockTemperatureModuleGen2,
        ...TEMPERATURE_MODULE_INFO,
      },
    })
  })
})
