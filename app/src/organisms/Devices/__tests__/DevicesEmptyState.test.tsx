import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { startDiscovery } from '../../../redux/discovery'
import {
  DevicesEmptyState,
  TROUBLESHOOTING_CONNECTION_PROBLEMS_URL,
} from '../DevicesEmptyState'

jest.mock('../../../redux/discovery')

const mockStartDiscovery = startDiscovery as jest.MockedFunction<
  typeof startDiscovery
>

const render = () => {
  return renderWithProviders(<DevicesEmptyState />, {
    i18nInstance: i18n,
  })
}

describe('DevicesEmptyState', () => {
  it('renders a "No robots found" message', () => {
    const [{ getByText }] = render()

    getByText('No robots found')
  })

  it('renders a refresh button that scans for robots', () => {
    const [{ getByRole }] = render()

    const refreshButton = getByRole('button', {
      name: 'Refresh',
    })
    fireEvent.click(refreshButton)
    expect(mockStartDiscovery).toBeCalled()
  })

  it('link to support documents', () => {
    const [{ getByRole }] = render()

    const troubleshootingLink = getByRole('link', {
      name: 'Learn more about troubleshooting connection problems',
    })
    expect(troubleshootingLink.getAttribute('href')).toBe(
      TROUBLESHOOTING_CONNECTION_PROBLEMS_URL
    )
  })
})
