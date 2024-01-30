import * as React from 'react'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  getU2EAdapterDevice,
  getU2EWindowsDriverStatus,
  NOT_APPLICABLE,
  OUTDATED,
  UP_TO_DATE,
} from '../../../redux/system-info'
import * as Fixtures from '../../../redux/system-info/__fixtures__'

import { U2EInformation } from '../U2EInformation'

jest.mock('../../../redux/system-info')

const mockGetU2EAdapterDevice = getU2EAdapterDevice as jest.MockedFunction<
  typeof getU2EAdapterDevice
>
const mockGetU2EWindowsDriverStatus = getU2EWindowsDriverStatus as jest.MockedFunction<
  typeof getU2EWindowsDriverStatus
>

const render = () => {
  return renderWithProviders(<U2EInformation />, {
    i18nInstance: i18n,
  })
}

describe('U2EInformation', () => {
  beforeEach(() => {
    mockGetU2EAdapterDevice.mockReturnValue(Fixtures.mockWindowsRealtekDevice)
    mockGetU2EWindowsDriverStatus.mockReturnValue(OUTDATED)
  })

  it('render the usb-to-ethernet adapter information', () => {
    render()
    screen.getByText('USB-to-Ethernet Adapter Information')
    screen.getByText(
      'Some OT-2s have an internal USB-to-Ethernet adapter. If your OT-2 uses this adapter, it will be added to your computer’s device list when you make a wired connection. If you have a Realtek adapter, it is essential that the driver is up to date.'
    )
    screen.getByText('Description')
    screen.getByText('Manufacturer')
    screen.getByText('Driver Version')
  })

  it('renders the test data of the usb-to-ethernet adapter information with mac', () => {
    mockGetU2EAdapterDevice.mockReturnValue({
      ...Fixtures.mockRealtekDevice,
    })
    mockGetU2EWindowsDriverStatus.mockReturnValue(NOT_APPLICABLE)
    render()
    screen.getByText('USB 10/100 LAN')
    screen.getByText('Realtek')
    screen.getByText('Unknown')
    expect(
      screen.queryByText(
        'An update is available for Realtek USB-to-Ethernet adapter driver'
      )
    ).not.toBeInTheDocument()
    expect(screen.queryByText('go to Realtek.com')).not.toBeInTheDocument()
  })

  it('should render text and driver information', () => {
    mockGetU2EWindowsDriverStatus.mockReturnValue(UP_TO_DATE)
    render()
    screen.getByText('Realtek USB FE Family Controller')
    screen.getByText('Realtek')
    screen.getByText('1.2.3')
    expect(
      screen.queryByText(
        'An update is available for Realtek USB-to-Ethernet adapter driver'
      )
    ).not.toBeInTheDocument()
    expect(screen.queryByText('go to Realtek.com')).not.toBeInTheDocument()
  })

  it('renders the not connected message and not display item titles when USB-to-Ethernet is not connected', () => {
    mockGetU2EAdapterDevice.mockReturnValue(null)
    render()
    expect(screen.queryByText('Description')).not.toBeInTheDocument()
    expect(screen.queryByText('Manufacturer')).not.toBeInTheDocument()
    expect(screen.queryByText('Driver Version')).not.toBeInTheDocument()
    screen.getByText('No USB-to-Ethernet adapter connected')
  })
})
