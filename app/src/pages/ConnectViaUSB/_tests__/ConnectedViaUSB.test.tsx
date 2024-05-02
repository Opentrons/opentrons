import * as React from 'react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { useConnectionsQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { ConnectViaUSB } from '../../../pages/ConnectViaUSB'

import type { UseQueryResult } from 'react-query'
import type { ActiveConnections } from '@opentrons/api-client'
import type * as ReactRouterDom from 'react-router-dom'

const mockPush = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof ReactRouterDom>()
  return {
    ...actual,
    useHistory: () => ({ push: mockPush } as any),
  }
})
vi.mock('@opentrons/react-api-client')

const render = (): ReturnType<typeof renderWithProviders> => {
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
    vi.mocked(useConnectionsQuery).mockReturnValue(({
      data: { connections: [] },
    } as unknown) as UseQueryResult<ActiveConnections>)
  })
  afterEach(() => {
    vi.resetAllMocks()
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
    fireEvent.click(getByRole('button'))
    expect(mockPush).toHaveBeenCalledWith('/network-setup')
  })

  it('should render successful connection text and button', () => {
    vi.mocked(useConnectionsQuery).mockReturnValue(({
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
    vi.mocked(useConnectionsQuery).mockReturnValue(({
      data: { connections: [{ agent: 'com.opentrons.app.usb' }] },
    } as unknown) as UseQueryResult<ActiveConnections>)
    const [{ getByText }] = render()
    const button = getByText('Continue')
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/emergency-stop')
  })
})
