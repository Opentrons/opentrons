import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useCurrentProtocol, useCurrentRun } from '../../ProtocolUpload/hooks'
import { useIsProtocolRunning } from '../hooks'
import { RobotStatusBanner } from '../RobotStatusBanner'

import type { Protocol, Run } from '@opentrons/api-client'

jest.mock('../../ProtocolUpload/hooks')
jest.mock('../hooks')

const mockUseCurrentProtocol = useCurrentProtocol as jest.MockedFunction<
  typeof useCurrentProtocol
>
const mockUseCurrentRun = useCurrentRun as jest.MockedFunction<
  typeof useCurrentRun
>
const mockUseIsProtocolRunning = useIsProtocolRunning as jest.MockedFunction<
  typeof useIsProtocolRunning
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotStatusBanner name="otie" local={true} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotStatusBanner', () => {
  beforeEach(() => {
    mockUseCurrentProtocol.mockReturnValue({} as any)
    mockUseCurrentRun.mockReturnValue({} as any)
    mockUseIsProtocolRunning.mockReturnValue(false)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the type of robot', () => {
    const [{ getByText }] = render()
    getByText('OT-2')
  })

  it('renders the robot name', () => {
    const [{ getByText }] = render()
    getByText('otie')
  })

  it('does not render a running protocol banner when a protocol is not running', () => {
    mockUseCurrentProtocol.mockReturnValue({
      data: { metadata: { protocolName: 'Testosaur' } },
    } as Protocol)

    mockUseIsProtocolRunning.mockReturnValue(false)

    const [{ queryByText }] = render()

    expect(queryByText('Running Testosaur')).toBeFalsy()

    const runLink = queryByText('Go to Run')
    expect(runLink).toBeFalsy()
  })

  it('renders a running protocol banner when a protocol is running', () => {
    mockUseCurrentProtocol.mockReturnValue({
      data: { metadata: { protocolName: 'Testosaur' } },
    } as Protocol)
    mockUseCurrentRun.mockReturnValue({
      data: { id: 'oties-run' },
    } as Run)
    mockUseIsProtocolRunning.mockReturnValue(true)

    const [{ getByRole, getByText }] = render()

    getByText('Testosaur; running')

    const runLink = getByRole('link', { name: 'Go to Run' })
    expect(runLink.getAttribute('href')).toEqual(
      '/devices/otie/protocol-runs/oties-run/run-log'
    )
  })
})
