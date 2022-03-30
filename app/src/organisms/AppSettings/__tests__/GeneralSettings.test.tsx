import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import * as Shell from '../../../redux/shell'
import { GeneralSettings } from '../GeneralSettings'

jest.mock('../../../redux/config')
jest.mock('../../../redux/shell')
jest.mock('../../../redux/analytics')
jest.mock('../../../redux/alerts')
jest.mock('../../UpdateAppModal', () => ({
  UpdateAppModal: () => null,
}))

const getAvailableShellUpdate = Shell.getAvailableShellUpdate as jest.MockedFunction<
  typeof Shell.getAvailableShellUpdate
>

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
    getAvailableShellUpdate.mockReturnValue(null)
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
    getByRole('button', {
      name: 'See how to restore a previous software version',
    })
    getByText(
      'It is very important for the robot and app software to be on the same version. Manage the robot software versions via Robot Settings > Advanced.'
    )
    getByRole('link', {
      name:
        'Learn more about keeping the Opentrons app and robot software in sync',
    })
  })
  it('renders correct info if there is update available', () => {
    getAvailableShellUpdate.mockReturnValue('5.0.0-beta.8')
    const [{ getByRole }] = render()
    getByRole('button', { name: 'View software update' })
  })
  it('renders the text and toggle for update alert section', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Receive an alert when an Opentrons software update is available')
    getByRole('switch', {
      name: 'Enable app update notifications',
    })
  })
  it('renders the ip address button', () => {
    const [{ getByRole }] = render()
    getByRole('button', { name: 'Set up connection' })
  })
})
