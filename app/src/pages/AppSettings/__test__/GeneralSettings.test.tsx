import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'

import { i18n } from '../../../i18n'
import { getAlertIsPermanentlyIgnored } from '../../../redux/alerts'
import * as Shell from '../../../redux/shell'
import { GeneralSettings } from '../GeneralSettings'

vi.mock('../../../redux/config')
vi.mock('../../../redux/shell')
vi.mock('../../../redux/analytics')
vi.mock('../../../redux/alerts')

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(
    <MemoryRouter>
      <GeneralSettings />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('GeneralSettings', () => {
  beforeEach(() => {
    vi.mocked(Shell.getAvailableShellUpdate).mockReturnValue(null)
    vi.mocked(getAlertIsPermanentlyIgnored).mockReturnValue(false)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders correct titles', () => {
    const [{ getByText }] = render()
    getByText('App Software Version')
    getByText('Software Update Alerts')
    getByText('Connect to a Robot via IP Address')
  })

  it('renders software version section with no update available', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Up to date')
    getByText('View latest release notes on')
    expect(getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md'
    )
    getByRole('button', {
      name: 'See how to restore a previous software version',
    })
    expect(
      'It is very important for the robot and app software to be on the same version. Manage the robot software versions via Robot Settings &gt; Advanced.'
    ).toBeTruthy()
    expect(
      getByRole('link', {
        name:
          'Learn more about keeping the Opentrons App and robot software in sync',
      })
    ).toHaveAttribute('href', 'https://support.opentrons.com/s/')
  })

  it('renders correct info if there is update available', () => {
    vi.mocked(Shell.getAvailableShellUpdate).mockReturnValue('5.0.0-beta.8')
    const [{ getByRole }] = render()
    getByRole('button', { name: 'View software update' })
  })

  it('renders correct info if there is no update available', () => {
    expect(screen.queryByText('View software update')).toBeNull()
  })

  it('renders correct info if there is update available but alert ignored enabled', () => {
    vi.mocked(Shell.getAvailableShellUpdate).mockReturnValue('5.0.0-beta.8')
    vi.mocked(getAlertIsPermanentlyIgnored).mockReturnValue(true)
    expect(screen.queryByText('View software update')).toBeNull()
  })

  it('renders the text and toggle for update alert section', () => {
    const [{ getByText, getByRole }] = render()
    getByText(
      'Receive an alert when an Opentrons software update is available.'
    )
    getByRole('switch', {
      name: 'Enable app update notifications',
    })
  })

  it('renders the ip address button', () => {
    const [{ getByRole }] = render()
    getByRole('button', { name: 'Set up connection' })
  })
})
