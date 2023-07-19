import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'

import { mockConnectedRobot } from '../../../../redux/discovery/__fixtures__'
import { mockTemperatureModule } from '../../../../redux/modules/__fixtures__'
import {
  useAttachedModules,
  useModuleRenderInfoForProtocolById,
  useRobot,
  useUnmatchedModulesForProtocol,
} from '..'

import type { ModuleModel, ModuleType } from '@opentrons/shared-data'

jest.mock('../useAttachedModules')
jest.mock('../useModuleRenderInfoForProtocolById')
jest.mock('../useRobot')

const mockUseModuleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById as jest.MockedFunction<
  typeof useModuleRenderInfoForProtocolById
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>

const mockMagneticBlockDef = {
  labwareOffset: { x: 5, y: 5, z: 5 },
  moduleId: 'someMagneticBlock',
  model: 'magneticBlockV1' as ModuleModel,
  type: 'magneticBlockType' as ModuleType,
  compatibleWith: [],
}
const mockMagneticModuleDef = {
  labwareOffset: { x: 5, y: 5, z: 5 },
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
  compatibleWith: [],
}
const mockTemperatureModuleDef = {
  labwareOffset: { x: 5, y: 5, z: 5 },
  moduleId: 'someTempModule',
  model: 'temperatureModuleV2' as ModuleModel,
  type: 'temperatureModuleType' as ModuleType,
  compatibleWith: ['temperatureModuleV1'],
}
describe('useModuleMatchResults', () => {
  beforeEach(() => {
    when(mockUseRobot)
      .calledWith(mockConnectedRobot.name)
      .mockReturnValue(mockConnectedRobot)
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(mockConnectedRobot.name, '1')
      .mockReturnValue({})

    when(mockUseAttachedModules)
      .calledWith()
      .mockReturnValue([mockTemperatureModule])
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no missing Module Ids if all connecting modules are present', () => {
    when(mockUseAttachedModules).calledWith().mockReturnValue([])
    const moduleId = 'fakeMagBlockId'
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(mockConnectedRobot.name, '1')
      .mockReturnValue({
        [moduleId]: {
          moduleId: moduleId,
          x: 0,
          y: 0,
          z: 0,
          moduleDef: mockMagneticBlockDef as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: null,
          slotName: '1',
        },
      })

    const { result } = renderHook(() =>
      useUnmatchedModulesForProtocol(mockConnectedRobot.name, '1')
    )
    const { missingModuleIds, remainingAttachedModules } = result.current
    expect(missingModuleIds).toStrictEqual([])
    expect(remainingAttachedModules).toStrictEqual([])
  })
  it('should return 1 missing moduleId if requested model not attached', () => {
    const moduleId = 'fakeMagModuleId'
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(mockConnectedRobot.name, '1')
      .mockReturnValue({
        [moduleId]: {
          moduleId: moduleId,
          x: 0,
          y: 0,
          z: 0,
          moduleDef: mockMagneticModuleDef as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: null,
          slotName: '1',
        },
      })
    when(mockUseAttachedModules).calledWith().mockReturnValue([])

    const { result } = renderHook(() =>
      useUnmatchedModulesForProtocol(mockConnectedRobot.name, '1')
    )
    const { missingModuleIds } = result.current
    expect(missingModuleIds).toStrictEqual([moduleId])
  })
  it('should return no missing moduleId if compatible model is attached', () => {
    const moduleId = 'someTempModule'
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(mockConnectedRobot.name, '1')
      .mockReturnValue({
        [moduleId]: {
          moduleId: moduleId,
          x: 0,
          y: 0,
          z: 0,
          moduleDef: mockTemperatureModuleDef as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: null,
          slotName: '1',
        },
      })

    const { result } = renderHook(() =>
      useUnmatchedModulesForProtocol(mockConnectedRobot.name, '1')
    )
    const { missingModuleIds } = result.current
    expect(missingModuleIds).toStrictEqual([])
  })
  it('should return one missing moduleId if nocompatible model is attached', () => {
    const moduleId = 'someTempModule'
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(mockConnectedRobot.name, '1')
      .mockReturnValue({
        [moduleId]: {
          moduleId: moduleId,
          x: 0,
          y: 0,
          z: 0,
          moduleDef: {
            ...mockTemperatureModuleDef,
            compatibleWith: ['fakeModuleModel'],
          } as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: null,
          slotName: '1',
        },
      })

    const { result } = renderHook(() =>
      useUnmatchedModulesForProtocol(mockConnectedRobot.name, '1')
    )
    const { missingModuleIds } = result.current
    expect(missingModuleIds).toStrictEqual([moduleId])
  })
  it('should return 1 remaining attached module if not required for protocols', () => {
    const remainingModule = mockTemperatureModule

    const { result } = renderHook(() =>
      useUnmatchedModulesForProtocol(mockConnectedRobot.name, '1')
    )
    const { remainingAttachedModules } = result.current
    expect(remainingAttachedModules).toStrictEqual([remainingModule])
  })
})
