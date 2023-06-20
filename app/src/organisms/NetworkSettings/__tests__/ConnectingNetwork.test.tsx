import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { ConnectingNetwork } from '../ConnectingNetwork'

const render = (props: React.ComponentProps<typeof ConnectingNetwork>) => {
  return renderWithProviders(
    <MemoryRouter>
      <ConnectingNetwork {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ConnectingNetwork', () => {
  let props: React.ComponentProps<typeof ConnectingNetwork>

  beforeEach(() => {
    props = {
      ssid: 'mockWifiSsid',
    }
  })
  it('should render text', () => {
    const [{ getByText }] = render(props)
    getByText('Connecting to mockWifiSsid...')
  })

  it('should render a spinner icon', () => {
    const [{ getByLabelText }] = render(props)
    expect(getByLabelText('spinner')).toBeInTheDocument()
  })
})
