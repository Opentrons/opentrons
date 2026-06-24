import { MemoryRouter, useLocation, useParams } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useEstopQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { InstrumentsAndModules } from '/app/organisms/Desktop/Devices/InstrumentsAndModules'
import { Peripherals } from '/app/organisms/Desktop/Devices/Peripherals'
import { RecentProtocolRuns } from '/app/organisms/Desktop/Devices/RecentProtocolRuns'
import { RobotOverview } from '/app/organisms/Desktop/Devices/RobotOverview'
import { DeviceDetailsDeckConfiguration } from '/app/organisms/DeviceDetailsDeckConfiguration'
import { DISENGAGED, NOT_PRESENT } from '/app/organisms/EmergencyStop'
import { useIsRobotViewable } from '/app/redux-resources/robots'

import { DeviceDetailsComponent } from '../DeviceDetailsComponent'

import type * as ReactRouterDom from 'react-router-dom'

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof ReactRouterDom>('react-router-dom')
  return { ...actual, useLocation: vi.fn(), useParams: vi.fn() }
})
vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/organisms/Desktop/Devices/InstrumentsAndModules')
vi.mock('/app/organisms/Desktop/Devices/RecentProtocolRuns')
vi.mock('/app/organisms/Desktop/Devices/RobotOverview')
vi.mock('/app/organisms/DeviceDetailsDeckConfiguration')
vi.mock('/app/organisms/Desktop/Devices/Peripherals')
vi.mock('/app/redux/discovery')
vi.mock('/app/redux-resources/robots')

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
    <MemoryRouter>
      <DeviceDetailsComponent robotName={ROBOT_NAME} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('DeviceDetailsComponent', () => {
  beforeEach(() => {
    vi.mocked(useEstopQuery).mockReturnValue({ data: mockEstopStatus } as any)
    vi.mocked(Peripherals).mockReturnValue(<div>MOCK INPUT DEVICES</div>)
    vi.mocked(useParams).mockReturnValue({})
    vi.mocked(useLocation).mockReturnValue({ hash: 'mock-hash' } as any)
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
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

  it('renders correct tabs when a robot is found', () => {
    render()
    screen.getByText('Hardware')
    screen.getByText('Deck Configuration')
    screen.getByText('Recent Protocol Runs')
  })

  it('renders InstrumentsAndModules', () => {
    render()
    expect(vi.mocked(InstrumentsAndModules)).toHaveBeenCalledWith(
      {
        robotName: ROBOT_NAME,
        isRobotViewable: true,
      },
      {}
    )
  })

  it('renders RecentProtocolRuns', () => {
    vi.mocked(useParams).mockReturnValue({ deviceDetailsTab: 'run-history' })
    render()
    expect(vi.mocked(RecentProtocolRuns)).toHaveBeenCalledWith(
      {
        robotName: ROBOT_NAME,
      },
      {}
    )
  })

  it('renders Deck Configuration', () => {
    vi.mocked(useParams).mockReturnValue({
      deviceDetailsTab: 'deck-configuration',
    })
    render()
    expect(vi.mocked(DeviceDetailsDeckConfiguration)).toHaveBeenCalled()
  })

  it('renders the Input Devices section', () => {
    render()

    screen.getByText('MOCK INPUT DEVICES')
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
