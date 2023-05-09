import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

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
    const [{ getByText, getByRole, getByLabelText }] = render(props)
    getByText('Join other network')
    getByRole('button', { name: 'Back' })
    getByRole('button', { name: 'Next' })
    getByText('Enter SSID')
    expect(getByLabelText('wifi_ssid')).toBeInTheDocument()
    getByRole('button', { name: 'a' })
    getByRole('button', { name: 'b' })
    getByRole('button', { name: 'c' })
    getByRole('button', { name: '/' }) // Only Normal software keyboard has
  })

  it('when tapping back button, call a mock function', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Back' })
    fireEvent.click(button)
    expect(props.setChangeState).toBeCalledWith({ type: null })
  })

  it('when tapping next button, call a mock function', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Next' })
    const aKey = getByRole('button', { name: 'a' })
    const bKey = getByRole('button', { name: 'b' })
    const cKey = getByRole('button', { name: 'c' })
    fireEvent.click(aKey)
    fireEvent.click(bKey)
    fireEvent.click(cKey)
    fireEvent.click(button)
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
    fireEvent.click(aKey)
    fireEvent.click(bKey)
    fireEvent.click(cKey)
    expect(inputBox).toHaveValue('abc')
  })
})
