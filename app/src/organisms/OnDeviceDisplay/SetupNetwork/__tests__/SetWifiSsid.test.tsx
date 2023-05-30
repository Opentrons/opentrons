import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { JOIN_OTHER } from '../../../Devices/RobotSettings/ConnectNetwork/constants'
import { SetWifiSsid } from '../SetWifiSsid'

const mockSetSelectedSsid = jest.fn()
const mockSetShowSelectAuthenticationType = jest.fn()
const mockSetChangeState = jest.fn()
const render = (props: React.ComponentProps<typeof SetWifiSsid>) => {
  return renderWithProviders(
    <MemoryRouter>
      <SetWifiSsid {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('SetWifiSsid', () => {
  let props: React.ComponentProps<typeof SetWifiSsid>
  beforeEach(() => {
    props = {
      setSelectedSsid: mockSetSelectedSsid,
      setShowSelectAuthenticationType: mockSetShowSelectAuthenticationType,
      setChangeState: mockSetChangeState,
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render text, buttons, input and software keyboard', () => {
    const [{ getByText, getByRole, getByTestId, getByLabelText }] = render(
      props
    )
    getByText('Join other network')
    getByTestId('SetWifiSsid_back_button')
    getByText('Continue')
    getByText('Enter network name')
    expect(getByLabelText('wifi_ssid')).toBeInTheDocument()
    getByRole('button', { name: 'a' })
    getByRole('button', { name: 'b' })
    getByRole('button', { name: 'c' })
    getByRole('button', { name: '/' }) // Only Normal software keyboard has
  })

  it('when tapping back button, call a mock function', () => {
    const [{ getByTestId }] = render(props)
    const button = getByTestId('SetWifiSsid_back_button')
    button.click()
    expect(props.setChangeState).toBeCalledWith({ type: null })
  })

  it('when tapping next button, call a mock function', () => {
    const [{ getByText, getByRole }] = render(props)
    const button = getByText('Continue')
    const aKey = getByRole('button', { name: 'a' })
    const bKey = getByRole('button', { name: 'b' })
    const cKey = getByRole('button', { name: 'c' })
    aKey.click()
    bKey.click()
    cKey.click()
    button.click()
    expect(props.setSelectedSsid).toBeCalledWith('abc')
    expect(props.setShowSelectAuthenticationType).toBeCalledWith(true)
    expect(props.setChangeState).toBeCalledWith({
      type: JOIN_OTHER,
      ssid: 'abc',
    })
  })

  it('when tapping keys, tapped key value is displayed in the input', () => {
    const [{ getByLabelText, getByRole }] = render(props)
    const inputBox = getByLabelText('wifi_ssid')
    const aKey = getByRole('button', { name: 'a' })
    const bKey = getByRole('button', { name: 'b' })
    const cKey = getByRole('button', { name: 'c' })
    aKey.click()
    bKey.click()
    cKey.click()
    expect(inputBox).toHaveValue('abc')
  })
})
