import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { getConfig } from '../../../redux/config'
import * as Shell from '../../../redux/shell'
import { GeneralSettings } from '../GeneralSettings'
import type { Config } from '@opentrons/app/src/redux/config/schema-types'
import type { ShellUpdateState } from '../../../redux/shell/types'

jest.mock('../../../redux/config')
jest.mock('../../../redux/shell')
jest.mock('../../../redux/analytics')
jest.mock('../../../redux/alerts')
jest.mock('../../UpdateAppModal', () => ({
  UpdateAppModal: () => null,
}))

const getShellUpdateState = Shell.getShellUpdateState as jest.MockedFunction<
  typeof Shell.getShellUpdateState
>
const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>

const render = () => {
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
    getShellUpdateState.mockReturnValue({
      available: false,
      info: null,
    } as ShellUpdateState)
    mockGetConfig.mockReturnValue({
      update: { channel: 'beta' },
    } as Config)
  })
  afterEach(() => {
    jest.resetAllMocks()
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
    getByRole('link', { name: 'GitHub' })
    getByRole('button', {
      name: 'See how to restore a previous software version',
    })
    expect(
      'It is very important for the robot and app software to be on the same version. Manage the robot software versions via Robot Settings &gt; Advanced.'
    ).toBeTruthy()
    getByRole('link', {
      name:
        'Learn more about keeping the Opentrons app and robot software in sync',
    })
  })

  it('renders correct info if there is update available and channel is beta', () => {
    getShellUpdateState.mockReturnValue({
      available: true,
      info: { version: '6.0.0-beta.0' },
    } as ShellUpdateState)
    const [{ getByRole }] = render()
    getByRole('button', { name: 'View software update' })
  })

  it('renders correct info if there is update available and channel is stable', () => {
    mockGetConfig.mockReturnValue({
      update: { channel: 'latest' },
    } as Config)
    getShellUpdateState.mockReturnValue({
      available: true,
      info: { version: '6.0.0' },
    } as ShellUpdateState)
    const [{ getByRole }] = render()
    getByRole('button', { name: 'View software update' })
  })

  it('renders correct info if there is beta update available but the channel is stable', () => {
    mockGetConfig.mockReturnValue({
      update: { channel: 'latest' },
    } as Config)
    getShellUpdateState.mockReturnValue({
      available: true,
      info: { version: '6.0.0-beta.0' },
    } as ShellUpdateState)
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
