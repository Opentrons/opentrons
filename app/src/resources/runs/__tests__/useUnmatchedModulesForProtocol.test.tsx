import { vi, it, expect, describe, beforeEach } from 'vitest'
import { when } from 'vitest-when'
import { renderHook } from '@testing-library/react'

import { mockConnectedRobot } from '/app/redux/discovery/__fixtures__'
import { mockTemperatureModule } from '/app/redux/modules/__fixtures__'
import { useRobot } from '/app/redux-resources/robots'
import { useAttachedModules } from '/app/resources/modules'
import {
  useModuleRenderInfoForProtocolById,
  useUnmatchedModulesForProtocol,
} from '..'

import type { ModuleDefinition } from '@opentrons/shared-data'

vi.mock('/app/resources/modules')
vi.mock('../useModuleRenderInfoForProtocolById')
vi.mock('/app/redux-resources/robots')

const mockMagneticBlockDef = {
  labwareOffset: { x: 5, y: 5, z: 5 },
  moduleId: 'someMagneticBlock',
  model: 'magneticBlockV1',
  type: 'magneticBlockType',
  compatibleWith: [],
}
const mockMagneticModuleDef = {
  labwareOffset: { x: 5, y: 5, z: 5 },
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2',
  type: 'magneticModuleType',
  compatibleWith: [],
}
const mockTemperatureModuleDef = {
  labwareOffset: { x: 5, y: 5, z: 5 },
  moduleId: 'someTempModule',
  model: 'temperatureModuleV2',
  type: 'temperatureModuleType',
  compatibleWith: ['temperatureModuleV1'],
}
describe('useModuleMatchResults', () => {
  beforeEach(() => {
    when(vi.mocked(useRobot))
      .calledWith(mockConnectedRobot.name)
      .thenReturn(mockConnectedRobot)
    when(vi.mocked(useModuleRenderInfoForProtocolById))
      .calledWith('1')
      .thenReturn({})

    when(vi.mocked(useAttachedModules))
      .calledWith()
      .thenReturn([mockTemperatureModule])
  })

  it('should return no missing Module Ids if all connecting modules are present', () => {
    when(vi.mocked(useAttachedModules)).calledWith().thenReturn([])
    const moduleId = 'fakeMagBlockId'
    when(vi.mocked(useModuleRenderInfoForProtocolById))
      .calledWith('1')
      .thenReturn({
        [moduleId]: {
          moduleId: moduleId,
          x: 0,
          y: 0,
          z: 0,
          moduleDef: (mockMagneticBlockDef as unknown) as ModuleDefinition,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: null,
          slotName: '1',
          conflictedFixture: null,
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
    when(vi.mocked(useModuleRenderInfoForProtocolById))
      .calledWith('1')
      .thenReturn({
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
          conflictedFixture: null,
        },
      })
    when(vi.mocked(useAttachedModules)).calledWith().thenReturn([])

    const { result } = renderHook(() =>
      useUnmatchedModulesForProtocol(mockConnectedRobot.name, '1')
    )
    const { missingModuleIds } = result.current
    expect(missingModuleIds).toStrictEqual([moduleId])
  })
  it('should return no missing moduleId if compatible model is attached', () => {
    const moduleId = 'someTempModule'
    when(vi.mocked(useModuleRenderInfoForProtocolById))
      .calledWith('1')
      .thenReturn({
        [moduleId]: {
          moduleId: moduleId,
          x: 0,
          y: 0,
          z: 0,
          moduleDef: (mockTemperatureModuleDef as unknown) as ModuleDefinition,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: null,
          slotName: '1',
          conflictedFixture: null,
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
    when(vi.mocked(useModuleRenderInfoForProtocolById))
      .calledWith('1')
      .thenReturn({
        [moduleId]: {
          moduleId: moduleId,
          x: 0,
          y: 0,
          z: 0,
          moduleDef: ({
            ...mockTemperatureModuleDef,
            compatibleWith: ['fakeModuleModel'],
          } as unknown) as ModuleDefinition,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          nestedLabwareDisplayName: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: null,
          slotName: '1',
          conflictedFixture: null,
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
