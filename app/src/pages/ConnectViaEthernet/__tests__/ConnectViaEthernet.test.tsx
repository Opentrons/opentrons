import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { vi, it, describe, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'

import { i18n } from '../../../i18n'
import * as Networking from '../../../redux/networking'
import { TitleHeader } from '../../../pages/ConnectViaEthernet/TitleHeader'
import { DisplayConnectionStatus } from '../../../pages/ConnectViaEthernet/DisplayConnectionStatus'
import { ConnectViaEthernet } from '../../../pages/ConnectViaEthernet'

vi.mock('../../../redux/networking')
vi.mock('../../../redux/discovery')
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
    const [{ getByText }] = render()
    getByText('mock TitleHeader')
    getByText('mock DisplayConnectionStatus')
  })
})
