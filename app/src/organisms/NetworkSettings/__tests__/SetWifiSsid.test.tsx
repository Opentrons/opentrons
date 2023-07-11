import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { SetWifiSsid } from '../SetWifiSsid'

const mockSetSelectedSsid = jest.fn()
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
      setInputSsid: mockSetSelectedSsid,
      errorMessage: null,
      inputSsid: 'mockSsid',
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render text, buttons, input and software keyboard', () => {
    const [{ getByText, getByRole, getByLabelText }] = render(props)
    getByText('Enter network name')
    getByLabelText('wifi_ssid')
    getByRole('button', { name: 'a' })
    getByRole('button', { name: 'b' })
    getByRole('button', { name: 'c' })
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
    expect(inputBox).toHaveValue('mockSsid')
  })
})
