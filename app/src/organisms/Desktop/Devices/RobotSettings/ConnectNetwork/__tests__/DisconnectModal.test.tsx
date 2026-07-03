import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { when } from 'vitest-when'

import { usePostWifiDisconnectMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useRobot } from '/app/redux-resources/robots'
import {
  mockConnectableRobot,
  mockReachableRobot,
} from '/app/redux/discovery/__fixtures__'
import {
  clearWifiStatus,
  getNetworkInterfaces,
  INTERFACE_WIFI,
} from '/app/redux/networking'
import { mockWifiNetwork } from '/app/redux/networking/__fixtures__'
import { useWifiList } from '/app/resources/networking/hooks'

import { DisconnectModal } from '../DisconnectModal'

import type { State } from '/app/redux/types'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/networking/hooks')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/redux/networking')

const ROBOT_NAME = 'otie'
const mockOnCancel = vi.fn()
const mockMutate = vi.fn()
const MOCK_WIFI = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'WI:FI:00:00:00:00',
  type: INTERFACE_WIFI,
}

type MutationReturn = ReturnType<typeof usePostWifiDisconnectMutation>

function mockDisconnectMutation(
  overrides: Partial<MutationReturn> = {}
): MutationReturn {
  return {
    mutate: mockMutate,
    status: 'idle',
    ...overrides,
  } as MutationReturn
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
  beforeEach(() => {
    mockOnCancel.mockClear()
    mockMutate.mockClear()
    vi.mocked(usePostWifiDisconnectMutation).mockReturnValue(
      mockDisconnectMutation()
    )
    when(useWifiList)
      .calledWith(ROBOT_NAME)
      .thenReturn([{ ...mockWifiNetwork, ssid: 'foo', active: true }])
    when(getNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .thenReturn({ wifi: MOCK_WIFI, ethernet: null })
    when(useRobot).calledWith(ROBOT_NAME).thenReturn(mockConnectableRobot)
  })

  it('renders disconnect modal title, body, and buttons', () => {
    render()

    screen.getByText('Disconnect from foo')
    screen.getByText('Are you sure you want to disconnect from foo?')
    screen.getByRole('button', { name: 'Cancel' })
    screen.getByRole('button', { name: 'Disconnect' })
  })

  it('renders pending body when request is pending', () => {
    vi.mocked(usePostWifiDisconnectMutation).mockReturnValue(
      mockDisconnectMutation({ status: 'loading' })
    )
    render()

    screen.getByText('Disconnect from foo')
    screen.getByText('Disconnecting from Wi-Fi network foo')
    screen.getByRole('button', { name: 'Cancel' })
    expect(clearWifiStatus).not.toHaveBeenCalled()
  })

  it('renders success body when request is pending and robot is not connectable', () => {
    vi.mocked(usePostWifiDisconnectMutation).mockReturnValue(
      mockDisconnectMutation({ status: 'loading' })
    )
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
    vi.mocked(usePostWifiDisconnectMutation).mockReturnValue(
      mockDisconnectMutation({ status: 'success' })
    )
    render()

    screen.getByText('Disconnected from Wi-Fi')
    screen.getByText(
      'Your robot has successfully disconnected from the Wi-Fi network.'
    )
    screen.getByRole('button', { name: 'Done' })
    expect(clearWifiStatus).toHaveBeenCalled()
  })

  it('renders success body when wifi is not connected during disconnect', () => {
    vi.mocked(usePostWifiDisconnectMutation).mockReturnValue(
      mockDisconnectMutation({ status: 'loading' })
    )
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
    vi.mocked(usePostWifiDisconnectMutation).mockReturnValue(
      mockDisconnectMutation({
        status: 'error',
        error: { message: 'it errored' } as any,
      })
    )
    render()

    screen.getByText('Disconnect from foo')
    screen.getByText('it errored')
    screen.getByText(
      'Your robot was unable to disconnect from Wi-Fi network foo.'
    )
    screen.getByText(
      'If you keep getting this message, try restarting your app and robot. If this does not resolve the issue, contact Opentrons Support.'
    )
    screen.getByRole('button', { name: 'Cancel' })
    screen.getByRole('button', { name: 'Disconnect' })
  })

  it('calls postWifiDisconnect mutation on click Disconnect', () => {
    render()

    expect(mockMutate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }))
    expect(mockMutate).toHaveBeenCalledWith({ ssid: 'foo' })
  })

  it('calls onCancel on cancel', () => {
    render()

    expect(mockOnCancel).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })
})
