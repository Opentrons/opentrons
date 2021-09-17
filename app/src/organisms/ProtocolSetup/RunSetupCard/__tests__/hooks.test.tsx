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

const MOCK_MODULE_MISSING_ID = ['temperatureModuleV1']

describe('useMissingModuleIds', () => {
  const store: Store<State> = createStore(jest.fn(), {})

  beforeEach(() => {
    store.dispatch = jest.fn()

    mockGetConnectedRobot.mockReturnValue(mockConnectedRobot)

    when(mockGetAttachedModules)
      .calledWith(undefined as any, mockConnectedRobot.name)
      .mockReturnValue([])

    when(mockUseModuleRenderInfoById).calledWith().mockReturnValue({})
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('should return no missing Module Ids', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(useMissingModuleIds, { wrapper })
    const missingModuleIds = result.current
    expect(missingModuleIds).toStrictEqual([])
    expect(typeof useMissingModuleIds).toBe('function')
  })
  it('should return 1 missing Module Ids', () => {
    const missingModuleIds = MOCK_MODULE_MISSING_ID
    expect(missingModuleIds).toStrictEqual(['temperatureModuleV1'])
    expect(typeof useMissingModuleIds).toBe('function')
  })
})
