import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'

import { i18n } from '../../../i18n'
import { startDiscovery } from '../../../redux/discovery'
import {
  DevicesEmptyState,
  TROUBLESHOOTING_CONNECTION_PROBLEMS_URL,
} from '../DevicesEmptyState'

vi.mock('../../../redux/discovery')

const render = () => {
  return renderWithProviders(<DevicesEmptyState />, {
    i18nInstance: i18n,
  })
}

describe('DevicesEmptyState', () => {
  it('renders a "No robots found" message', () => {
    render()

    screen.getByText('No robots found')
  })

  it('renders a refresh button that scans for robots', () => {
    render()

    const refreshButton = screen.getByRole('button', {
      name: 'Refresh',
    })
    fireEvent.click(refreshButton)
    expect(startDiscovery).toBeCalled()
  })

  it('link to support documents', () => {
    render()

    const troubleshootingLink = screen.getByRole('link', {
      name: 'Learn more about troubleshooting connection problems',
    })
    expect(troubleshootingLink.getAttribute('href')).toBe(
      TROUBLESHOOTING_CONNECTION_PROBLEMS_URL
    )
  })
})
