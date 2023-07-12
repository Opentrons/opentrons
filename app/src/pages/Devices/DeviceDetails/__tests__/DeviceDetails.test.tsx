import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { MemoryRouter, Route } from 'react-router-dom'

import {
  componentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'

import { i18n } from '../../../../i18n'
import {
  useRobot,
  useSyncRobotClock,
} from '../../../../organisms/Devices/hooks'
import { InstrumentsAndModules } from '../../../../organisms/Devices/InstrumentsAndModules'
import { RecentProtocolRuns } from '../../../../organisms/Devices/RecentProtocolRuns'
import { RobotOverview } from '../../../../organisms/Devices/RobotOverview'
import { getScanning } from '../../../../redux/discovery'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'
import { DeviceDetails } from '..'

import type { State } from '../../../../redux/types'

jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../../../../organisms/Devices/InstrumentsAndModules')
jest.mock('../../../../organisms/Devices/RecentProtocolRuns')
jest.mock('../../../../organisms/Devices/RobotOverview')
jest.mock('../../../../redux/discovery')

const mockUseSyncRobotClock = useSyncRobotClock as jest.MockedFunction<
  typeof useSyncRobotClock
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockRobotOverview = RobotOverview as jest.MockedFunction<
  typeof RobotOverview
>
const mockInstrumentsAndModules = InstrumentsAndModules as jest.MockedFunction<
  typeof InstrumentsAndModules
>
const mockRecentProtocolRuns = RecentProtocolRuns as jest.MockedFunction<
  typeof RecentProtocolRuns
>
const mockGetScanning = getScanning as jest.MockedFunction<typeof getScanning>

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/devices/:robotName">
        <DeviceDetails />
      </Route>
      <Route path="/devices">devices page</Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('DeviceDetails', () => {
  beforeEach(() => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(null)
    when(mockRobotOverview)
      .calledWith(componentPropsMatcher({ robotName: 'otie' }))
      .mockReturnValue(<div>Mock RobotOverview</div>)
    when(mockInstrumentsAndModules)
      .calledWith(componentPropsMatcher({ robotName: 'otie' }))
      .mockReturnValue(<div>Mock InstrumentsAndModules</div>)
    when(mockRecentProtocolRuns)
      .calledWith(componentPropsMatcher({ robotName: 'otie' }))
      .mockReturnValue(<div>Mock RecentProtocolRuns</div>)
    when(mockGetScanning)
      .calledWith({} as State)
      .mockReturnValue(false)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('redirects to devices page when a robot is not found and not scanning', () => {
    const [{ getByText }] = render('/devices/otie')

    getByText('devices page')
  })

  it('renders null when a robot is not found and discovery client is scanning', () => {
    when(mockGetScanning)
      .calledWith({} as State)
      .mockReturnValue(true)
    const [{ queryByText }] = render('/devices/otie')

    expect(queryByText('Mock RobotOverview')).toBeNull()
    expect(queryByText('Mock InstrumentsAndModules')).toBeNull()
    expect(queryByText('Mock RecentProtocolRuns')).toBeNull()
  })

  it('renders a RobotOverview when a robot is found and syncs clock', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockConnectableRobot)
    const [{ getByText }] = render('/devices/otie')

    getByText('Mock RobotOverview')
    expect(mockUseSyncRobotClock).toHaveBeenCalledWith('otie')
  })

  it('renders InstrumentsAndModules when a robot is found', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockConnectableRobot)
    const [{ getByText }] = render('/devices/otie')

    getByText('Mock InstrumentsAndModules')
  })

  it('renders RecentProtocolRuns when a robot is found', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockConnectableRobot)
    const [{ getByText }] = render('/devices/otie')

    getByText('Mock RecentProtocolRuns')
  })
})
