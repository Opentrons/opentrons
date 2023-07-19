import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { useConnectionsQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { ConnectViaUSB } from '../ConnectViaUSB'

import type { UseQueryResult } from 'react-query'
import type { ActiveConnections } from '@opentrons/api-client'

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})
jest.mock('@opentrons/react-api-client')

const mockUseConnectionsQuery = useConnectionsQuery as jest.MockedFunction<
  typeof useConnectionsQuery
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ConnectViaUSB />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ConnectViaUSB', () => {
  beforeEach(() => {
    when(mockUseConnectionsQuery)
      .calledWith()
      .mockReturnValue(({
        data: { connections: [] },
      } as unknown) as UseQueryResult<ActiveConnections>)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render no connection text, button, and image', () => {
    const [{ getByText, getByLabelText }] = render()
    getByText('USB')
    getByText('No connection found')
    getByLabelText('Connect_via_usb_back_button')
    getByText('1. Connect the USB A-to-B cable to the robot’s USB-B port.')
    getByText('2. Connect the cable to an open USB port on your computer.')
    getByText('3. Launch the Opentrons App on the computer to continue.')
  })

  it('should call a mock function when tapping back button', () => {
    const [{ getByRole }] = render()
    getByRole('button').click()
    expect(mockPush).toHaveBeenCalledWith('/network-setup')
  })

  it('should render successful connection text and button', () => {
    when(mockUseConnectionsQuery)
      .calledWith()
      .mockReturnValue(({
        data: { connections: [{ agent: 'com.opentrons.app.usb' }] },
      } as unknown) as UseQueryResult<ActiveConnections>)
    const [{ getByText }] = render()
    getByText('USB')
    getByText('Successfully connected!')
    getByText(
      'Find your robot in the Opentrons App to install software updates.'
    )
    getByText('Continue')
  })

  it('should route to the rename robot page when tapping continue button', () => {
    when(mockUseConnectionsQuery)
      .calledWith()
      .mockReturnValue(({
        data: { connections: [{ agent: 'com.opentrons.app.usb' }] },
      } as unknown) as UseQueryResult<ActiveConnections>)
    const [{ getByText }] = render()
    const button = getByText('Continue')
    button.click()
    expect(mockPush).toHaveBeenCalledWith('/emergency-stop')
  })
})
