import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { SetWifiCred } from '../SetWifiCred'

const mockSetShowSelectAuthenticationType = jest.fn()
const mockSetPassword = jest.fn()
const mockHandleConnect = jest.fn()
jest.mock('../../../../redux/discovery')
jest.mock('../../../../redux/robot-api')

const render = (props: React.ComponentProps<typeof SetWifiCred>) => {
  return renderWithProviders(
    <MemoryRouter>
      <SetWifiCred {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('SetWifiCred', () => {
  let props: React.ComponentProps<typeof SetWifiCred>
  beforeEach(() => {
    props = {
      ssid: 'mockWifi',
      authType: 'wpa-psk',
      setShowSelectAuthenticationType: mockSetShowSelectAuthenticationType,
      password: 'mock-password',
      setPassword: mockSetPassword,
      handleConnect: mockHandleConnect,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render text, button and software keyboard', () => {
    const [{ getByText, getByRole, getAllByRole, getByLabelText }] = render(
      props
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

  it('should display password', () => {
    const [{ getByLabelText }] = render(props)
    const inputBox = getByLabelText('wifi_password')
    expect(inputBox).toHaveValue('mock-password')
  })

  it('should switch the input type and button text when tapping the icon next to the input', () => {
    const [{ getByRole, getByLabelText }] = render(props)
    const button = getByRole('button', { name: 'Show' })
    // ToDo: 11/08/2022 kj switch to getByRole once understand the issue on this input
    const inputBox = getByLabelText('wifi_password')
    expect(inputBox).toHaveAttribute('type', 'password')
    fireEvent.click(button)
    getByRole('button', { name: 'Hide' })
    expect(inputBox).toHaveAttribute('type', 'text')
  })

  it('should call mock function when tapping back', () => {
    const [{ getByText }] = render(props)
    const button = getByText('Back')
    fireEvent.click(button)
    expect(props.setShowSelectAuthenticationType).toHaveBeenCalled()
  })

  it('should call mock function when tapping connect', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Connect' })
    fireEvent.click(button)
    expect(props.handleConnect).toHaveBeenCalled()
  })
})
