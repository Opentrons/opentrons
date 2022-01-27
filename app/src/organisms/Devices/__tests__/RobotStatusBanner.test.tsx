import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import {
  Protocol,
  Run,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
} from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useCurrentProtocolRun } from '../../ProtocolUpload/hooks'
import { useIsProtocolRunning } from '../hooks'
import { RobotStatusBanner } from '../RobotStatusBanner'

import type { UseCurrentProtocolRun } from '../../ProtocolUpload/hooks'

jest.mock('../../ProtocolUpload/hooks')
jest.mock('../hooks')

const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
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
    mockUseCurrentProtocolRun.mockReturnValue({} as UseCurrentProtocolRun)
    mockUseIsProtocolRunning.mockReturnValue(false)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the type of robot', () => {
    const [{ getByText }] = render()
    expect(getByText('OT-2')).toBeTruthy()
  })

  it('renders the robot name', () => {
    const [{ getByText }] = render()
    expect(getByText('otie')).toBeTruthy()
  })

  it('renders an idle robot status when not running a protocol', () => {
    const [{ getByText }] = render()
    expect(getByText('Idle')).toBeTruthy()
  })

  it('renders an active robot status when a protocol is running', () => {
    mockUseIsProtocolRunning.mockReturnValue(true)

    const [{ getByText }] = render()

    expect(getByText('Active')).toBeTruthy()
  })

  it('does not render a running protocol banner when a protocol is not running', () => {
    mockUseCurrentProtocolRun.mockReturnValue({
      runRecord: { data: { status: RUN_STATUS_IDLE } } as Run,
      protocolRecord: {
        data: { metadata: { protocolName: 'Testosaur' } },
      } as Protocol,
    } as UseCurrentProtocolRun)

    const [{ queryByText }] = render()

    expect(queryByText('Running Testosaur')).toBeFalsy()

    const runLink = queryByText('Go to Run')
    expect(runLink).toBeFalsy()
  })

  it('renders a running protocol banner when a protocol is running', () => {
    mockUseCurrentProtocolRun.mockReturnValue({
      runRecord: { data: { status: RUN_STATUS_RUNNING } } as Run,
      protocolRecord: {
        data: { metadata: { protocolName: 'Testosaur' } },
      } as Protocol,
    } as UseCurrentProtocolRun)
    mockUseIsProtocolRunning.mockReturnValue(true)

    const [{ getByText }] = render()

    expect(getByText('Running Testosaur')).toBeTruthy()

    const runLink = getByText('Go to Run')
    expect(runLink).toBeTruthy()
    expect(runLink.getAttribute('href')).toEqual(
      '/devices/otie/protocol-runs/run'
    )
  })
})
