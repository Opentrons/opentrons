import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import * as discoverySelectors from '../../../../redux/discovery/selectors'
import { useModuleRenderInfoById } from '../../hooks'
import { getAttachedModules } from '../../../../redux/modules'
import { mockConnectedRobot } from '../../../../redux/discovery/__fixtures__'
import { renderHook } from '@testing-library/react-hooks'
import { useMissingModuleIds } from '../hooks'
import type { Store } from 'redux'
import type { State } from '../../../../redux/types'
import type { ModuleModel, ModuleType } from '@opentrons/shared-data'

jest.mock('../../../../redux/protocol')
jest.mock('../../hooks')
jest.mock('../../../../redux/modules')
jest.mock('../../../../redux/discovery/selectors')
jest.mock('../../../../redux/types')

const mockUseModuleRenderInfoById = useModuleRenderInfoById as jest.MockedFunction<
  typeof useModuleRenderInfoById
>
const mockGetConnectedRobot = discoverySelectors.getConnectedRobot as jest.MockedFunction<
  typeof discoverySelectors.getConnectedRobot
>
const mockGetAttachedModules = getAttachedModules as jest.MockedFunction<
  typeof getAttachedModules
>

const mockMagneticModuleDef = {
  labwareOffset: { x: 5, y: 5, z: 5 },
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
}

describe('useMissingModuleIds', () => {
  const store: Store<State> = createStore(jest.fn(), {})

  beforeEach(() => {
    store.dispatch = jest.fn()

    when(mockGetConnectedRobot)
      .calledWith(undefined as any)
      .mockReturnValue(mockConnectedRobot)

    when(mockGetAttachedModules)
      .calledWith(undefined as any, mockConnectedRobot.name)
      .mockReturnValue([])

    when(mockUseModuleRenderInfoById).calledWith().mockReturnValue({})
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('should return no missing Module Ids if all modules present', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(useMissingModuleIds, { wrapper })
    const missingModuleIds = result.current
    expect(missingModuleIds).toStrictEqual([])
  })
  it('should return 1 missing moduleId if requested model not attached', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const moduleId = 'fakeMagModuleId'
    when(mockUseModuleRenderInfoById)
      .calledWith()
      .mockReturnValue({
        [moduleId]: {
          x: 0,
          y: 0,
          z: 0,
          moduleDef: mockMagneticModuleDef as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
        },
      })

    const { result } = renderHook(useMissingModuleIds, { wrapper })
    expect(result.current).toStrictEqual([moduleId])
  })
})
