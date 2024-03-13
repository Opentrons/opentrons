import * as React from 'react'
import { vi, it, describe, expect, beforeEach } from 'vitest'
import { when } from 'vitest-when'
import { MemoryRouter, Route } from 'react-router-dom'

import { renderWithProviders } from '../../../../__testing-utils__'

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

vi.mock('../../../../organisms/Devices/hooks')
vi.mock('../../../../organisms/Devices/InstrumentsAndModules')
vi.mock('../../../../organisms/Devices/RecentProtocolRuns')
vi.mock('../../../../organisms/Devices/RobotOverview')
vi.mock('../../../../redux/discovery')

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
    when(useRobot).calledWith('otie').thenReturn(null)
    when(getScanning)
      .calledWith({} as State)
      .thenReturn(false)
  })

  it('redirects to devices page when a robot is not found and not scanning', () => {
    const [{ getByText }] = render('/devices/otie')

    getByText('devices page')
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
