import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { SetWifiCred } from '../SetWifiCred'

const mockSetPassword = jest.fn()
jest.mock('../../../redux/discovery')
jest.mock('../../../redux/robot-api')

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
      password: 'mock-password',
      setPassword: mockSetPassword,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render text, button and software keyboard', () => {
    const [{ getByText, getByRole, getByLabelText }] = render(props)
    getByText('Enter password')
    expect(getByLabelText('wifi_password')).toBeInTheDocument()
    getByRole('button', { name: 'Show' })
    // software keyboard
    getByRole('button', { name: 'del' })
    getByRole('button', { name: 'a' })
    getByRole('button', { name: 'SHIFT' })
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
})
