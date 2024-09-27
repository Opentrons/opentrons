import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { when } from 'vitest-when'

import { i18n } from '/app/i18n'
import { useRobot } from '/app/redux-resources/robots'
import { useWifiList } from '/app/resources/networking/hooks'
import {
  mockConnectableRobot,
  mockReachableRobot,
} from '/app/redux/discovery/__fixtures__'
import {
  clearWifiStatus,
  getNetworkInterfaces,
  INTERFACE_WIFI,
  postWifiDisconnect,
} from '/app/redux/networking'
import { mockWifiNetwork } from '/app/redux/networking/__fixtures__'
import {
  dismissRequest,
  getRequestById,
  useDispatchApiRequest,
  PENDING,
  FAILURE,
  SUCCESS,
} from '/app/redux/robot-api'
import { DisconnectModal } from '../DisconnectModal'

import type { DispatchApiRequestType } from '/app/redux/robot-api'
import type { RequestState } from '/app/redux/robot-api/types'
import type { State } from '/app/redux/types'

vi.mock('/app/resources/networking/hooks')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/redux/networking')
vi.mock('/app/redux/robot-api')

const ROBOT_NAME = 'otie'
const LAST_ID = 'a request id'
const mockOnCancel = vi.fn()
const MOCK_WIFI = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'WI:FI:00:00:00:00',
  type: INTERFACE_WIFI,
}

const render = () => {
  return renderWithProviders(
    <DisconnectModal onCancel={mockOnCancel} robotName={ROBOT_NAME} />,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('DisconnectModal', () => {
  let dispatchApiRequest: DispatchApiRequestType

  beforeEach(() => {
    dispatchApiRequest = vi.fn()
    when(useWifiList)
      .calledWith(ROBOT_NAME)
      .thenReturn([{ ...mockWifiNetwork, ssid: 'foo', active: true }])
    vi.mocked(useDispatchApiRequest).mockReturnValue([
      dispatchApiRequest,
      [LAST_ID],
    ])
    when(getRequestById)
      .calledWith({} as State, LAST_ID)
      .thenReturn({} as RequestState)
    when(getNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .thenReturn({ wifi: MOCK_WIFI, ethernet: null })
    when(useRobot).calledWith(ROBOT_NAME).thenReturn(mockConnectableRobot)
  })

  it('renders disconnect modal title, body, and buttons', () => {
    render()

    screen.getByText('Disconnect from foo')
    screen.getByText('Are you sure you want to disconnect from foo?')
    screen.getByRole('button', { name: 'cancel' })
    screen.getByRole('button', { name: 'Disconnect' })
  })

  it('renders pending body when request is pending', () => {
    when(getRequestById)
      .calledWith({} as State, LAST_ID)
      .thenReturn({ status: PENDING } as RequestState)
    render()

    screen.getByText('Disconnect from foo')
    screen.getByText('Disconnecting from Wi-Fi network foo')
    screen.getByRole('button', { name: 'cancel' })
    expect(clearWifiStatus).not.toHaveBeenCalled()
  })

  it('renders success body when request is pending and robot is not connectable', () => {
    when(getRequestById)
      .calledWith({} as State, LAST_ID)
      .thenReturn({ status: PENDING } as RequestState)
    when(useRobot).calledWith(ROBOT_NAME).thenReturn(mockReachableRobot)
    render()

    screen.getByText('Disconnected from Wi-Fi')
    screen.getByText(
      'Your robot has successfully disconnected from the Wi-Fi network.'
    )
    screen.getByRole('button', { name: 'Done' })
    expect(clearWifiStatus).toHaveBeenCalled()
  })

  it('renders success body when request is successful', () => {
    when(getRequestById)
      .calledWith({} as State, LAST_ID)
      .thenReturn({ status: SUCCESS } as RequestState)
    render()

    screen.getByText('Disconnected from Wi-Fi')
    screen.getByText(
      'Your robot has successfully disconnected from the Wi-Fi network.'
    )
    screen.getByRole('button', { name: 'Done' })
    expect(clearWifiStatus).toHaveBeenCalled()
  })

  it('renders success body when wifi is not connected', () => {
    when(getNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .thenReturn({
        wifi: { ...MOCK_WIFI, ipAddress: null },
        ethernet: null,
      })
    render()

    screen.getByText('Disconnected from Wi-Fi')
    screen.getByText(
      'Your robot has successfully disconnected from the Wi-Fi network.'
    )
    screen.getByRole('button', { name: 'Done' })
    expect(clearWifiStatus).toHaveBeenCalled()
  })

  it('renders error body when request is unsuccessful', () => {
    when(getRequestById)
      .calledWith({} as State, LAST_ID)
      .thenReturn({
        status: FAILURE,
        error: { message: 'it errored' },
      } as RequestState)
    render()

    screen.getByText('Disconnect from foo')
    screen.getByText('it errored')
    screen.getByText(
      'Your robot was unable to disconnect from Wi-Fi network foo.'
    )
    screen.getByText(
      'If you keep getting this message, try restarting your app and robot. If this does not resolve the issue, contact Opentrons Support.'
    )
    screen.getByRole('button', { name: 'cancel' })
    screen.getByRole('button', { name: 'Disconnect' })
  })

  it('dispatches postWifiDisconnect on click Disconnect', () => {
    render()

    expect(postWifiDisconnect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }))
    expect(postWifiDisconnect).toHaveBeenCalledWith(ROBOT_NAME, 'foo')
  })

  it('dismisses last request and calls onCancel on cancel', () => {
    render()

    expect(dismissRequest).not.toHaveBeenCalled()
    expect(mockOnCancel).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    expect(dismissRequest).toHaveBeenCalledWith(LAST_ID)
    expect(mockOnCancel).toHaveBeenCalledWith()
  })
})
