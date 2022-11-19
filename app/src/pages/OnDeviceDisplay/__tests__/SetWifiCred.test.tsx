import * as React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Networking from '../../../redux/networking'
import { useDispatchApiRequest } from '../../../redux/robot-api'
import * as Fixtures from '../../../redux/networking/__fixtures__'
import { SetWifiCred } from '../SetWifiCred'

import type { DispatchApiRequestType } from '../../../redux/robot-api'

const mockPush = jest.fn()
const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar' },
  {
    ...Fixtures.mockWifiNetwork,
    ssid: 'baz',
  },
]
const mockRobotName = 'otie'
const mockOptions = {
  ssid: 'mockWiFi',
  securityType: Networking.SECURITY_NONE,
  hidden: false,
  psk: 'mockPsk',
}

jest.mock('../../../redux/networking')
jest.mock('../../../redux/discovery')
jest.mock('../../../redux/robot-api')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>
const mockPostWifiConfigure = Networking.postWifiConfigure as jest.MockedFunction<
  typeof Networking.postWifiConfigure
>

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/set-wifi-cred/:ssid">
        <SetWifiCred />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const mockGetWifiList = Networking.getWifiList as jest.MockedFunction<
  typeof Networking.getWifiList
>

describe('SetWifiCred', () => {
  let dispatchApiRequest: DispatchApiRequestType
  beforeEach(() => {
    mockGetWifiList.mockReturnValue(mockWifiList)
    dispatchApiRequest = jest.fn()
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render text, button and software keyboard', () => {
    const [{ getByText, getByRole, getAllByRole, getByLabelText }] = render(
      '/set-wifi-cred/mockWifi'
    )
    getByText('mockWifi')
    getByText('Back')
    getByRole('button', { name: 'Connect' })
    getByText('Enter password')
    expect(getByLabelText('wifi_password')).toBeInTheDocument()
    getByRole('button', { name: 'Show' })
    // software keyboard
    getByRole('button', { name: 'backspace' })
    getByRole('button', { name: 'a' })
    const shiftButtons = getAllByRole('button', { name: 'shift' })
    expect(shiftButtons.length).toBe(2)
  })

  it('should display a dot when typing a char', () => {
    const [{ getByRole, getByLabelText }] = render('/set-wifi-cred/mockWifi')
    const inputBox = getByLabelText('wifi_password')
    const aKey = getByRole('button', { name: 'a' })
    const bKey = getByRole('button', { name: 'b' })
    const cKey = getByRole('button', { name: 'c' })
    fireEvent.click(aKey)
    fireEvent.click(bKey)
    fireEvent.click(cKey)
    expect(inputBox).toHaveValue('abc')
  })

  it('should switch the input type and button text when tapping the icon next to the input', () => {
    const [{ getByRole, getByLabelText }] = render('/set-wifi-cred/mockWifi')
    const button = getByRole('button', { name: 'Show' })
    // ToDo: 11/08/2022 kj switch to getByRole once understand the issue on this input
    const inputBox = getByLabelText('wifi_password')
    expect(inputBox).toHaveAttribute('type', 'password')
    fireEvent.click(button)
    getByRole('button', { name: 'Hide' })
    expect(inputBox).toHaveAttribute('type', 'text')
  })

  it('should call mock function when tapping back', () => {
    const [{ getByText }] = render('/set-wifi-cred/mockWifi')
    const button = getByText('Back')
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/select-wifi-network')
  })

  it('should call mock function when tapping connect', () => {
    const [{ getByRole }] = render('/set-wifi-cred/mockWifi')
    const button = getByRole('button', { name: 'Connect' })
    fireEvent.click(button)
    expect(dispatchApiRequest).toBeCalledWith(
      mockPostWifiConfigure(mockRobotName, mockOptions)
    )
  })
})
