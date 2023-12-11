import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { renderHook } from '@testing-library/react'
import { createStore, Store } from 'redux'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from 'react-query'

import { useRobot } from '../'
import { useRobotAnalyticsData } from '../useRobotAnalyticsData'
import { getAttachedPipettes } from '../../../../redux/pipettes'
import { getRobotSettings } from '../../../../redux/robot-settings'
import {
  getRobotApiVersion,
  getRobotFirmwareVersion,
} from '../../../../redux/discovery'

import type { DiscoveredRobot } from '../../../../redux/discovery/types'
import type { AttachedPipettesByMount } from '../../../../redux/pipettes/types'

jest.mock('@opentrons/react-api-client')
jest.mock('../../hooks')
jest.mock('../../../../redux/discovery')
jest.mock('../../../../redux/pipettes')
jest.mock('../../../../redux/robot-settings')

const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockGetRobotApiVersion = getRobotApiVersion as jest.MockedFunction<
  typeof getRobotApiVersion
>
const mockGetRobotSettings = getRobotSettings as jest.MockedFunction<
  typeof getRobotSettings
>
const mockGetRobotFirmwareVersion = getRobotFirmwareVersion as jest.MockedFunction<
  typeof getRobotFirmwareVersion
>
const mockGetAttachedPipettes = getAttachedPipettes as jest.MockedFunction<
  typeof getAttachedPipettes
>

const ROBOT_SETTINGS = [
  { id: `setting1`, value: true, title: '', description: '' },
  { id: `setting2`, value: false, title: '', description: '' },
]
const ROBOT_VERSION = 'version1'
const ROBOT_FIRMWARE_VERSION = 'firmwareVersion1'
const ATTACHED_PIPETTES = {
  left: { id: '1', model: 'testModelLeft' },
  right: { id: '2', model: 'testModelRight' },
}

let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
let store: Store<any> = createStore(jest.fn(), {})

describe('useProtocolAnalysisErrors hook', () => {
  beforeEach(() => {
    store = createStore(jest.fn(), {})
    store.dispatch = jest.fn()
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    when(mockUseRobot).calledWith('noRobot').mockReturnValue(null)
    mockGetRobotApiVersion.mockReturnValue(ROBOT_VERSION)
    mockGetRobotSettings.mockReturnValue(ROBOT_SETTINGS)
    mockGetRobotFirmwareVersion.mockReturnValue(ROBOT_FIRMWARE_VERSION)
    mockGetAttachedPipettes.mockReturnValue(
      ATTACHED_PIPETTES as AttachedPipettesByMount
    )
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns null when robot is null or undefined', () => {
    const { result } = renderHook(() => useRobotAnalyticsData('noRobot'), {
      wrapper,
    })
    expect(result.current).toStrictEqual(null)
  })

  it('returns robot analytics data when robot exists', () => {
    when(mockUseRobot)
      .calledWith('otie')
      .mockReturnValue({} as DiscoveredRobot)

    const { result } = renderHook(() => useRobotAnalyticsData('otie'), {
      wrapper,
    })
    expect(result.current).toStrictEqual({
      robotApiServerVersion: ROBOT_VERSION,
      robotFF_setting1: true,
      robotFF_setting2: false,
      robotLeftPipette: 'testModelLeft',
      robotRightPipette: 'testModelRight',
      robotSmoothieVersion: ROBOT_FIRMWARE_VERSION,
    })
  })
})
