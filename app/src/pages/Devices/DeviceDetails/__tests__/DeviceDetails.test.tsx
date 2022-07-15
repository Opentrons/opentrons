import * as React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../../redux/modules/__fixtures__'
import {
  useAttachedModules,
  useRobot,
  useSyncRobotClock,
} from '../../../../organisms/Devices/hooks'
import { PipettesAndModules } from '../../../../organisms/Devices/PipettesAndModules'
import { RecentProtocolRuns } from '../../../../organisms/Devices/RecentProtocolRuns'
import { RobotOverview } from '../../../../organisms/Devices/RobotOverview'
import { DeviceDetails } from '..'

jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../../../../organisms/Devices/PipettesAndModules')
jest.mock('../../../../organisms/Devices/RecentProtocolRuns')
jest.mock('../../../../organisms/Devices/RobotOverview')

const mockUseSyncRobotClock = useSyncRobotClock as jest.MockedFunction<
  typeof useSyncRobotClock
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockRobotOverview = RobotOverview as jest.MockedFunction<
  typeof RobotOverview
>
const mockPipettesAndModules = PipettesAndModules as jest.MockedFunction<
  typeof PipettesAndModules
>
const mockRecentProtocolRuns = RecentProtocolRuns as jest.MockedFunction<
  typeof RecentProtocolRuns
>

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/devices/:robotName">
        <DeviceDetails />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('DeviceDetails', () => {
  beforeEach(() => {
    mockUseAttachedModules.mockReturnValue(
      mockFetchModulesSuccessActionPayloadModules
    )
    mockUseRobot.mockReturnValue(null)
    mockRobotOverview.mockReturnValue(<div>Mock RobotOverview</div>)
    mockPipettesAndModules.mockReturnValue(<div>Mock PipettesAndModules</div>)
    mockRecentProtocolRuns.mockReturnValue(<div>Mock RecentProtocolRuns</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('does not render a RobotOverview when a robot is not found', () => {
    const [{ queryByText }] = render('/devices/otie')

    expect(queryByText('Mock RobotOverview')).toBeFalsy()
  })

  it('renders a RobotOverview when a robot is found and syncs clock', () => {
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    const [{ getByText }] = render('/devices/otie')

    getByText('Mock RobotOverview')
    expect(mockUseSyncRobotClock).toHaveBeenCalledWith('otie')
  })

  it('renders PipettesAndModules when a robot is found', () => {
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    const [{ getByText }] = render('/devices/otie')

    getByText('Mock PipettesAndModules')
  })

  it('renders RecentProtocolRuns when a robot is found', () => {
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    const [{ getByText }] = render('/devices/otie')

    getByText('Mock RecentProtocolRuns')
  })
})
