import { vi, it, describe, expect, beforeEach } from 'vitest'
import { when } from 'vitest-when'
import { screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'
import { useSyncRobotClock } from '/app/organisms/Desktop/Devices/hooks'
import { InstrumentsAndModules } from '/app/organisms/Desktop/Devices/InstrumentsAndModules'
import { RecentProtocolRuns } from '/app/organisms/Desktop/Devices/RecentProtocolRuns'
import { RobotOverview } from '/app/organisms/Desktop/Devices/RobotOverview'
import { getScanning } from '/app/redux/discovery'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import { useRobot } from '/app/redux-resources/robots'
import { DeviceDetails } from '..'

import type { State } from '/app/redux/types'

vi.mock('/app/organisms/Desktop/Devices/hooks')
vi.mock('/app/organisms/Desktop/Devices/InstrumentsAndModules')
vi.mock('/app/organisms/Desktop/Devices/RecentProtocolRuns')
vi.mock('/app/organisms/Desktop/Devices/RobotOverview')
vi.mock('/app/redux/discovery')
vi.mock('/app/redux-resources/robots')

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Routes>
        <Route path="/devices/:robotName" element={<DeviceDetails />} />
        <Route path="/devices" element={<>devices page</>} />
      </Routes>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('DeviceDetails', () => {
  beforeEach(() => {
    when(useRobot).calledWith('otie').thenReturn(null)
    when(getScanning)
      .calledWith({} as State)
      .thenReturn(false)
  })

  it('redirects to devices page when a robot is not found and not scanning', () => {
    render('/devices/otie')

    screen.getByText('devices page')
  })

  it('renders null when a robot is not found and discovery client is scanning', () => {
    when(getScanning)
      .calledWith({} as State)
      .thenReturn(true)
    render('/devices/otie')

    expect(vi.mocked(RobotOverview)).not.toHaveBeenCalled()
    expect(vi.mocked(InstrumentsAndModules)).not.toHaveBeenCalled()
    expect(vi.mocked(RecentProtocolRuns)).not.toHaveBeenCalled()
  })

  it('renders a RobotOverview when a robot is found and syncs clock', () => {
    when(useRobot).calledWith('otie').thenReturn(mockConnectableRobot)
    render('/devices/otie')

    expect(vi.mocked(RobotOverview)).toHaveBeenCalled()
    expect(useSyncRobotClock).toHaveBeenCalledWith('otie')
  })

  it('renders InstrumentsAndModules when a robot is found', () => {
    when(useRobot).calledWith('otie').thenReturn(mockConnectableRobot)
    render('/devices/otie')
    expect(vi.mocked(InstrumentsAndModules)).toHaveBeenCalled()
  })

  it('renders RecentProtocolRuns when a robot is found', () => {
    when(useRobot).calledWith('otie').thenReturn(mockConnectableRobot)
    render('/devices/otie')
    expect(vi.mocked(RecentProtocolRuns)).toHaveBeenCalled()
  })
})
