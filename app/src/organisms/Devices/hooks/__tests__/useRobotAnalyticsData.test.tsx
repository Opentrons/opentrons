import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'
import { createStore, Store } from 'redux'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from 'react-query'

import { useRobot } from '../'
import { useRobotAnalyticsData } from '../useRobotAnalyticsData'
import { getAttachedPipettes } from '../../../../redux/pipettes'
import { getRobotSettings } from '../../../../redux/robot-settings'
import { FF_PREFIX } from '../../../../redux/analytics'
import {
  getRobotApiVersion,
  getRobotFirmwareVersion,
} from '../../../../redux/discovery'

import type { DiscoveredRobot } from '../../../../redux/discovery/types'
import type { RobotAnalyticsData } from '../../../../redux/analytics/types'
import { AttachedPipettesByMount } from '../../../../redux/pipettes/types'
import { useDeckCalibrationStatus } from '../useDeckCalibrationStatus'

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
  { id: `${FF_PREFIX}_setting1`, value: true, title: '', description: '' },
  { id: `${FF_PREFIX}_setting2`, value: false, title: '', description: '' },
]
const ROBOT_VERSION = 'version1'
const ATTACHED_PIPETTES = {
  left: { id: '1', model: 'testModelLeft' },
  right: { id: '2', model: 'testModelLeft' },
}

describe('useProtocolAnalysisErrors hook', () => {
  let wrapper: React.FunctionComponent<{}>
  let store: Store<any> = createStore(jest.fn(), {})
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
    when(mockUseRobot).calledWith(null).mockReturnValue(null)
    mockGetRobotApiVersion.mockReturnValue(ROBOT_VERSION)
    mockGetRobotSettings.mockReturnValue(ROBOT_SETTINGS)
    mockGetRobotFirmwareVersion.mockReturnValue('firmwareVersion1')
    mockGetAttachedPipettes.mockReturnValue(
      ATTACHED_PIPETTES as AttachedPipettesByMount
    )
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns null when robot is null or undefined', () => {
    const { result } = renderHook(() => useRobotAnalyticsData('otie'), {
      wrapper,
    })
    expect(result.current).toStrictEqual(null)
  })
})
