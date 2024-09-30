import { MemoryRouter } from 'react-router-dom'
import { vi, it, describe, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'
import * as Networking from '/app/redux/networking'
import { TitleHeader } from '../TitleHeader'
import { DisplayConnectionStatus } from '../DisplayConnectionStatus'
import { ConnectViaEthernet } from '../'

vi.mock('/app/redux/networking')
vi.mock('/app/redux/discovery')
vi.mock('../TitleHeader')
vi.mock('../DisplayConnectionStatus')

const initialMockEthernet = {
  ipAddress: '127.0.0.101',
  subnetMask: '255.255.255.231',
  macAddress: 'ET:NT:00:00:00:00',
  type: Networking.INTERFACE_ETHERNET,
}

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ConnectViaEthernet />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ConnectViaEthernet', () => {
  beforeEach(() => {
    vi.mocked(Networking.getNetworkInterfaces).mockReturnValue({
      wifi: null,
      ethernet: initialMockEthernet,
    })

    vi.mocked(TitleHeader).mockReturnValue(<div>mock TitleHeader</div>)
    vi.mocked(DisplayConnectionStatus).mockReturnValue(
      <div>mock DisplayConnectionStatus</div>
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render TitleHeader component and DisplayConnectionStatus component', () => {
    render()
    screen.getByText('mock TitleHeader')
    screen.getByText('mock DisplayConnectionStatus')
  })
})
