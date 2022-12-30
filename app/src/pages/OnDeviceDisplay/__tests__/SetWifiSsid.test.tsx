import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { SelectAuthenticationType } from '../../../organisms/SetupNetwork/SelectAuthenticationType'
import { SetWifiSsid } from '../SetWifiSsid'

const mockPush = jest.fn()

jest.mock('../../../organisms/SetupNetwork/SelectAuthenticationType')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockSelectAuthenticationType = SelectAuthenticationType as jest.MockedFunction<
  typeof SelectAuthenticationType
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <SetWifiSsid />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('SetWifiSsid', () => {
  beforeEach(() => {
    mockSelectAuthenticationType.mockReturnValue(
      <div>Mock SelectAuthenticationType</div>
    )
  })

  it('should render text, buttons, input and software keyboard', () => {
    const [{ getByText, getByRole, getByLabelText }] = render()
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
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Back' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/network-setup/wifi')
  })

  it('when tapping next button, call a mock function', () => {
    const [{ getByText, getByRole }] = render()
    const button = getByRole('button', { name: 'Next' })
    fireEvent.click(button)
    getByText('Mock SelectAuthenticationType')
  })

  it('when tapping keys, tapped key value is displayed in the input', () => {
    const [{ getByLabelText, getByRole }] = render()
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
