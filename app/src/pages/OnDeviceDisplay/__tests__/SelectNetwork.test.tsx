import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getWifiList } from '../../../redux/networking'
import * as Fixtures from '../../../redux/networking/__fixtures__'
import { SetWifiCred } from '../../../organisms/SetupNetwork/SetWifiCred'
import { SelectWifiNetwork } from '../SelectWifiNetwork'

const mockPush = jest.fn()
const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar' },
  {
    ...Fixtures.mockWifiNetwork,
    ssid: 'baz',
  },
]

jest.mock('../../../organisms/SetupNetwork/SetWifiCred')
jest.mock('../../../redux/networking/selectors')
jest.mock('../../../redux/discovery/selectors')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <SelectWifiNetwork />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const mockGetWifiList = getWifiList as jest.MockedFunction<typeof getWifiList>
const mockSetWifiCred = SetWifiCred as jest.MockedFunction<typeof SetWifiCred>

describe('SelectNetwork', () => {
  beforeEach(() => {
    mockGetWifiList.mockReturnValue(mockWifiList)
    mockSetWifiCred.mockReturnValue(<div>Mock SetWifiCred</div>)
  })

  it('should render a wifi list', () => {
    const [{ getByText }] = render()
    getByText('Connect to a network')
    getByText('foo')
    getByText('bar')
    getByText('baz')
  })

  it('render setwificred when tapping a one of wifi ssid', () => {
    const [{ getByText }] = render()
    const ssid = getByText('foo')
    fireEvent.click(ssid)
    getByText('Mock SetWifiCred')
  })
})
