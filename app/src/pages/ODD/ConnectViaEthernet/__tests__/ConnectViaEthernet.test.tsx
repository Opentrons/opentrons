import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { INTERFACE_ETHERNET } from '@opentrons/api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useNetworkInterfaces } from '/app/resources/networking/hooks'

import { ConnectViaEthernet } from '../'
import { DisplayConnectionStatus } from '../DisplayConnectionStatus'
import { TitleHeader } from '../TitleHeader'

vi.mock('/app/resources/networking/hooks')
vi.mock('/app/redux/discovery')
vi.mock('../TitleHeader')
vi.mock('../DisplayConnectionStatus')

const initialMockEthernet = {
  ipAddress: '127.0.0.101',
  subnetMask: '255.255.255.231',
  macAddress: 'ET:NT:00:00:00:00',
  type: INTERFACE_ETHERNET,
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
    vi.mocked(useNetworkInterfaces).mockReturnValue({
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
