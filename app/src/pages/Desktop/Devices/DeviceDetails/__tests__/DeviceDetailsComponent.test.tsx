import { vi, it, describe, expect, beforeEach } from 'vitest'
import { when } from 'vitest-when'

import { renderWithProviders } from '/app/__testing-utils__'
import { useEstopQuery } from '@opentrons/react-api-client'

import { i18n } from '/app/i18n'
import { InstrumentsAndModules } from '/app/organisms/Desktop/Devices/InstrumentsAndModules'
import { RecentProtocolRuns } from '/app/organisms/Desktop/Devices/RecentProtocolRuns'
import { RobotOverview } from '/app/organisms/Desktop/Devices/RobotOverview'
import { DISENGAGED, NOT_PRESENT } from '/app/organisms/EmergencyStop'
import { DeviceDetailsDeckConfiguration } from '/app/organisms/DeviceDetailsDeckConfiguration'
import { useIsFlex } from '/app/redux-resources/robots'
import { DeviceDetailsComponent } from '../DeviceDetailsComponent'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/organisms/Desktop/Devices/InstrumentsAndModules')
vi.mock('/app/organisms/Desktop/Devices/RecentProtocolRuns')
vi.mock('/app/organisms/Desktop/Devices/RobotOverview')
vi.mock('/app/organisms/DeviceDetailsDeckConfiguration')
vi.mock('/app/redux/discovery')

const ROBOT_NAME = 'otie'
const mockEstopStatus = {
  data: {
    status: DISENGAGED,
    leftEstopPhysicalStatus: DISENGAGED,
    rightEstopPhysicalStatus: NOT_PRESENT,
  },
}

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
    vi.mocked(useEstopQuery).mockReturnValue({ data: mockEstopStatus } as any)
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(false)
  })

  it('renders a RobotOverview when a robot is found and syncs clock', () => {
    render()
    expect(vi.mocked(RobotOverview)).toHaveBeenCalledWith(
      {
        robotName: ROBOT_NAME,
      },
      {}
    )
  })

  it('renders InstrumentsAndModules when a robot is found', () => {
    render()
    expect(vi.mocked(InstrumentsAndModules)).toHaveBeenCalledWith(
      {
        robotName: ROBOT_NAME,
      },
      {}
    )
  })

  it('renders RecentProtocolRuns when a robot is found', () => {
    render()
    expect(vi.mocked(RecentProtocolRuns)).toHaveBeenCalledWith(
      {
        robotName: ROBOT_NAME,
      },
      {}
    )
  })

  it('renders Deck Configuration when a robot is flex', () => {
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)
    render()
    expect(vi.mocked(DeviceDetailsDeckConfiguration)).toHaveBeenCalled()
  })

  it.todo('renders EstopBanner when estop is engaged')
  // mockEstopStatus.data.status = PHYSICALLY_ENGAGED
  // vi.mocked(useEstopQuery).mockReturnValue({ data: mockEstopStatus } as any)
  // const { result } = renderHook(() => useEstopContext(), { wrapper })
  // result.current.setIsEmergencyStopModalDismissed(true)
  // // act(() => result.current.setIsEmergencyStopModalDismissed(true))
  // const [{ getByText }] = render()
  // getByText('mock EstopBanner')
})
