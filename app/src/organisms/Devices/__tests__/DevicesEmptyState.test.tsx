import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { startDiscovery } from '../../../redux/discovery'
import {
  DevicesEmptyState,
  OT2_GET_STARTED_URL,
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

    expect(getByText('No robots found')).toBeTruthy()
  })

  it('renders a refresh button that scans for robots', () => {
    const [{ getByRole }] = render()

    const refreshButton = getByRole('button', {
      name: 'Refresh',
    })
    refreshButton.click()
    expect(mockStartDiscovery).toBeCalled()
  })

  it('links to support documents', () => {
    const [{ getByRole }] = render()

    const settingUpLink = getByRole('link', {
      name: 'Learn about setting up a new robot',
    })
    expect(settingUpLink.getAttribute('href')).toBe(OT2_GET_STARTED_URL)

    const troubleshootingLink = getByRole('link', {
      name: 'Learn more about troubleshooting connection problems',
    })
    expect(troubleshootingLink.getAttribute('href')).toBe(
      TROUBLESHOOTING_CONNECTION_PROBLEMS_URL
    )
  })
})
