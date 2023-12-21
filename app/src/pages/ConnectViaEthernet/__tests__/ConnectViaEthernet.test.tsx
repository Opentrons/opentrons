import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '@opentrons/app/src/i18n'
import * as Networking from '@opentrons/app/src/redux/networking'
import { TitleHeader } from '@opentrons/app/src/pages/ConnectViaEthernet/TitleHeader'
import { DisplayConnectionStatus } from '@opentrons/app/src/pages/ConnectViaEthernet/DisplayConnectionStatus'
import { ConnectViaEthernet } from '@opentrons/app/src/pages/ConnectViaEthernet'

jest.mock('../../../../redux/networking')
jest.mock('../../../../redux/discovery')
jest.mock('../TitleHeader')
jest.mock('../DisplayConnectionStatus')

const initialMockEthernet = {
  ipAddress: '127.0.0.101',
  subnetMask: '255.255.255.231',
  macAddress: 'ET:NT:00:00:00:00',
  type: Networking.INTERFACE_ETHERNET,
}

const mockTitleHeader = TitleHeader as jest.MockedFunction<typeof TitleHeader>
const mockDisplayConnectionStatus = DisplayConnectionStatus as jest.MockedFunction<
  typeof DisplayConnectionStatus
>
const mockGetNetworkInterfaces = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>

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
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: null,
      ethernet: initialMockEthernet,
    })

    mockTitleHeader.mockReturnValue(<div>mock TitleHeader</div>)
    mockDisplayConnectionStatus.mockReturnValue(
      <div>mock DisplayConnectionStatus</div>
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render TitleHeader component and DisplayConnectionStatus component', () => {
    const [{ getByText }] = render()
    getByText('mock TitleHeader')
    getByText('mock DisplayConnectionStatus')
  })
})
