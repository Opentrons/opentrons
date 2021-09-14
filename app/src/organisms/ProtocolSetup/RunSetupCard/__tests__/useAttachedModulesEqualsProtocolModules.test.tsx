import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import noModulesProtocol from '@opentrons/shared-data/protocol/fixtures/4/simpleV4.json'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import * as discoverySelectors from '../../../../redux/discovery/selectors'
import { getModuleRenderCoords } from '../../utils/getModuleRenderCoords'
import { getAttachedModules } from '../../../../redux/modules'
import { mockConnectedRobot } from '../../../../redux/discovery/__fixtures__'
import { renderHook } from '@testing-library/react-hooks'
import { useAttachedModulesEqualsProtocolModules } from '../useAttachedModulesEqualsProtocolModules'
import { getProtocolData } from '../../../../redux/protocol'
import type { Store } from 'redux'
import type { State } from '../../../../redux/types'

jest.mock('../../../../redux/protocol')
jest.mock('../../utils/getModuleRenderCoords')
jest.mock('../../../../redux/modules')
jest.mock('../../../../redux/discovery/selectors')
jest.mock('../../../../redux/types')

const mockGetProtocolData = getProtocolData as jest.MockedFunction<
  typeof getProtocolData
>
const mockGetModuleRenderCoords = getModuleRenderCoords as jest.MockedFunction<
  typeof getModuleRenderCoords
>
const mockGetConnectedRobot = discoverySelectors.getConnectedRobot as jest.MockedFunction<
  typeof discoverySelectors.getConnectedRobot
>
const mockGetAttachedModules = getAttachedModules as jest.MockedFunction<
  typeof getAttachedModules
>

const mockModuleRenderCoords = {
  mockModuleId: { x: 0, y: 0, z: 0, moduleModel: 'magneticModuleV1' as any },
}

describe('useAttachedmodulesEqualsProtocolModules', () => {
  const store: Store<State> = createStore(jest.fn(), {})

  beforeEach(() => {
    store.dispatch = jest.fn()

    mockGetConnectedRobot.mockReturnValue(mockConnectedRobot)

    mockGetProtocolData.mockReturnValue(noModulesProtocol as any)

    when(mockGetAttachedModules)
      .calledWith(undefined as any, mockConnectedRobot.name)
      .mockReturnValue([])

    when(mockGetModuleRenderCoords)
      .calledWith(noModulesProtocol as any, standardDeckDef as any)
      .mockReturnValue(mockModuleRenderCoords)
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('should return a working hook and return boolean should equal false', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(useAttachedModulesEqualsProtocolModules, {
      wrapper,
    })
    const { allModulesAttached } = result.current
    expect(allModulesAttached).toBe(false)
    expect(typeof useAttachedModulesEqualsProtocolModules).toBe('function')
  })
})
