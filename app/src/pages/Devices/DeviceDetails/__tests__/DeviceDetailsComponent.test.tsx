import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'

import {
  componentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { InstrumentsAndModules } from '../../../../organisms/Devices/InstrumentsAndModules'
import { RecentProtocolRuns } from '../../../../organisms/Devices/RecentProtocolRuns'
import { RobotOverview } from '../../../../organisms/Devices/RobotOverview'
import { DeviceDetailsComponent } from '../DeviceDetailsComponent'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../../../../organisms/Devices/InstrumentsAndModules')
jest.mock('../../../../organisms/Devices/RecentProtocolRuns')
jest.mock('../../../../organisms/Devices/RobotOverview')
jest.mock('../../../../redux/discovery')

const ROBOT_NAME = 'otie'

const mockRobotOverview = RobotOverview as jest.MockedFunction<
  typeof RobotOverview
>
const mockInstrumentsAndModules = InstrumentsAndModules as jest.MockedFunction<
  typeof InstrumentsAndModules
>
const mockRecentProtocolRuns = RecentProtocolRuns as jest.MockedFunction<
  typeof RecentProtocolRuns
>

const render = () => {
  return renderWithProviders(
    <DeviceDetailsComponent robotName={ROBOT_NAME} />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('DeviceDetailsComponent', () => {
  beforeEach(() => {
    when(mockRobotOverview)
      .calledWith(componentPropsMatcher({ robotName: ROBOT_NAME }))
      .mockReturnValue(<div>Mock RobotOverview</div>)
    when(mockInstrumentsAndModules)
      .calledWith(componentPropsMatcher({ robotName: ROBOT_NAME }))
      .mockReturnValue(<div>Mock InstrumentsAndModules</div>)
    when(mockRecentProtocolRuns)
      .calledWith(componentPropsMatcher({ robotName: ROBOT_NAME }))
      .mockReturnValue(<div>Mock RecentProtocolRuns</div>)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders a RobotOverview when a robot is found and syncs clock', () => {
    const [{ getByText }] = render()
    getByText('Mock RobotOverview')
  })

  it('renders InstrumentsAndModules when a robot is found', () => {
    const [{ getByText }] = render()
    getByText('Mock InstrumentsAndModules')
  })

  it('renders RecentProtocolRuns when a robot is found', () => {
    const [{ getByText }] = render()
    getByText('Mock RecentProtocolRuns')
  })

  it.todo('renders EstopBanner when estop is engaged')
  // mockEstopStatus.data.status = PHYSICALLY_ENGAGED
  // mockUseEstopQuery.mockReturnValue({ data: mockEstopStatus } as any)
  // const { result } = renderHook(() => useEstopContext(), { wrapper })
  // result.current.setIsEmergencyStopModalDismissed(true)
  // // act(() => result.current.setIsEmergencyStopModalDismissed(true))
  // const [{ getByText }] = render()
  // getByText('mock EstopBanner')
})
