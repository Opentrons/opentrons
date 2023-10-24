import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import { useRobot } from '../../../../../organisms/Devices/hooks'
import { useWifiList } from '../../../../../resources/networking/hooks'
import {
  mockConnectableRobot,
  mockReachableRobot,
} from '../../../../../redux/discovery/__fixtures__'
import {
  clearWifiStatus,
  getNetworkInterfaces,
  INTERFACE_WIFI,
  postWifiDisconnect,
} from '../../../../../redux/networking'
import { mockWifiNetwork } from '../../../../../redux/networking/__fixtures__'
import {
  dismissRequest,
  getRequestById,
  useDispatchApiRequest,
  PENDING,
  FAILURE,
  SUCCESS,
} from '../../../../../redux/robot-api'
import { DisconnectModal } from '../DisconnectModal'

import type { DispatchApiRequestType } from '../../../../../redux/robot-api'
import type { RequestState } from '../../../../../redux/robot-api/types'
import type { State } from '../../../../../redux/types'

jest.mock('../../../../../resources/networking/hooks')
jest.mock('../../../../../organisms/Devices/hooks')
jest.mock('../../../../../redux/networking')
jest.mock('../../../../../redux/robot-api')

const mockUseWifiList = useWifiList as jest.MockedFunction<typeof useWifiList>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>
const mockGetRequestById = getRequestById as jest.MockedFunction<
  typeof getRequestById
>
const mockGetNetworkInterfaces = getNetworkInterfaces as jest.MockedFunction<
  typeof getNetworkInterfaces
>
const mockPostWifiDisconnect = postWifiDisconnect as jest.MockedFunction<
  typeof postWifiDisconnect
>
const mockDismissRequest = dismissRequest as jest.MockedFunction<
  typeof dismissRequest
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockClearWifiStatus = clearWifiStatus as jest.MockedFunction<
  typeof clearWifiStatus
>

const ROBOT_NAME = 'otie'
const LAST_ID = 'a request id'
const mockOnCancel = jest.fn()
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
    dispatchApiRequest = jest.fn()
    when(mockUseWifiList)
      .calledWith(ROBOT_NAME)
      .mockReturnValue([{ ...mockWifiNetwork, ssid: 'foo', active: true }])
    when(mockUseDispatchApiRequest)
      .calledWith()
      .mockReturnValue([dispatchApiRequest, [LAST_ID]])
    when(mockGetRequestById)
      .calledWith({} as State, LAST_ID)
      .mockReturnValue({} as RequestState)
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue({ wifi: MOCK_WIFI, ethernet: null })
    when(mockUseRobot)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(mockConnectableRobot)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders disconnect modal title, body, and buttons', () => {
    const { getByRole, getByText } = render()

    getByText('Disconnect from foo')
    getByText('Are you sure you want to disconnect from foo?')
    getByRole('button', { name: 'cancel' })
    getByRole('button', { name: 'Disconnect' })
  })

  it('renders pending body when request is pending', () => {
    when(mockGetRequestById)
      .calledWith({} as State, LAST_ID)
      .mockReturnValue({ status: PENDING } as RequestState)
    const { getByRole, getByText } = render()

    getByText('Disconnect from foo')
    getByText('Disconnecting from Wi-Fi network foo')
    getByRole('button', { name: 'cancel' })
    expect(mockClearWifiStatus).not.toHaveBeenCalled()
  })

  it('renders success body when request is pending and robot is not connectable', () => {
    when(mockGetRequestById)
      .calledWith({} as State, LAST_ID)
      .mockReturnValue({ status: PENDING } as RequestState)
    when(mockUseRobot)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(mockReachableRobot)
    const { getByRole, getByText } = render()

    getByText('Disconnected from Wi-Fi')
    getByText(
      'Your robot has successfully disconnected from the Wi-Fi network.'
    )
    getByRole('button', { name: 'Done' })
    expect(mockClearWifiStatus).toHaveBeenCalled()
  })

  it('renders success body when request is successful', () => {
    when(mockGetRequestById)
      .calledWith({} as State, LAST_ID)
      .mockReturnValue({ status: SUCCESS } as RequestState)
    const { getByRole, getByText } = render()

    getByText('Disconnected from Wi-Fi')
    getByText(
      'Your robot has successfully disconnected from the Wi-Fi network.'
    )
    getByRole('button', { name: 'Done' })
    expect(mockClearWifiStatus).toHaveBeenCalled()
  })

  it('renders success body when wifi is not connected', () => {
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue({
        wifi: { ...MOCK_WIFI, ipAddress: null },
        ethernet: null,
      })
    const { getByRole, getByText } = render()

    getByText('Disconnected from Wi-Fi')
    getByText(
      'Your robot has successfully disconnected from the Wi-Fi network.'
    )
    getByRole('button', { name: 'Done' })
    expect(mockClearWifiStatus).toHaveBeenCalled()
  })

  it('renders error body when request is unsuccessful', () => {
    when(mockGetRequestById)
      .calledWith({} as State, LAST_ID)
      .mockReturnValue({
        status: FAILURE,
        error: { message: 'it errored' },
      } as RequestState)
    const { getByRole, getByText } = render()

    getByText('Disconnect from foo')
    getByText('it errored')
    getByText('Your robot was unable to disconnect from Wi-Fi network foo.')
    getByText(
      'If you keep getting this message, try restarting your app and/or robot. If this does not resolve the issue please contact Opentrons Support.'
    )
    getByRole('button', { name: 'cancel' })
    getByRole('button', { name: 'Disconnect' })
    expect(mockClearWifiStatus).not.toHaveBeenCalled()
  })

  it('dispatches postWifiDisconnect on click Disconnect', () => {
    const { getByRole } = render()

    expect(mockPostWifiDisconnect).not.toHaveBeenCalled()
    getByRole('button', { name: 'Disconnect' }).click()
    expect(mockPostWifiDisconnect).toHaveBeenCalledWith(ROBOT_NAME, 'foo')
  })

  it('dismisses last request and calls onCancel on cancel', () => {
    const { getByRole } = render()

    expect(mockDismissRequest).not.toHaveBeenCalled()
    expect(mockOnCancel).not.toHaveBeenCalled()
    getByRole('button', { name: 'cancel' }).click()
    expect(mockDismissRequest).toHaveBeenCalledWith(LAST_ID)
    expect(mockOnCancel).toHaveBeenCalledWith()
  })
})
