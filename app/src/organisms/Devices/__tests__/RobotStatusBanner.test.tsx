import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { RUN_STATUS_RUNNING } from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'

import { i18n } from '../../../i18n'
import { useCurrentRunId } from '../../../organisms/ProtocolUpload/hooks'
import { useCurrentRunStatus } from '../../../organisms/RunTimeControl/hooks'
import { useProtocolDetailsForRun } from '../hooks'
import { RobotStatusBanner } from '../RobotStatusBanner'

import type { ProtocolFile } from '@opentrons/shared-data'

jest.mock('../../../organisms/ProtocolUpload/hooks')
jest.mock('../../../organisms/RunTimeControl/hooks')
jest.mock('../hooks')

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseCurrentRunStatus = useCurrentRunStatus as jest.MockedFunction<
  typeof useCurrentRunStatus
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolFile<{}>

const PROTOCOL_DETAILS = {
  displayName: 'Testosaur',
  protocolData: simpleV6Protocol,
}

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
    when(mockUseCurrentRunId).calledWith().mockReturnValue(null)
    when(mockUseCurrentRunStatus).calledWith().mockReturnValue(null)
    when(mockUseProtocolDetailsForRun)
      .calledWith(null)
      .mockReturnValue({
        displayName: null,
        protocolData: {} as ProtocolFile<{}>,
      })
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders the type of robot and robot name', () => {
    const [{ getByText }] = render()
    getByText('OT-2')
    getByText('otie')
  })

  it('does not render a running protocol banner when a protocol is not running', () => {
    const [{ queryByText }] = render()

    expect(queryByText('Testosaur;')).toBeFalsy()
    expect(queryByText('Go to Run')).toBeFalsy()
  })

  it('renders a running protocol banner when a protocol is running', () => {
    when(mockUseCurrentRunId).calledWith().mockReturnValue('1')
    when(mockUseCurrentRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_RUNNING)
    when(mockUseProtocolDetailsForRun)
      .calledWith('1')
      .mockReturnValue(PROTOCOL_DETAILS)

    const [{ getByRole, getByText }] = render()

    getByText('Testosaur; Running')

    const runLink = getByRole('link', { name: 'Go to Run' })
    expect(runLink.getAttribute('href')).toEqual(
      '/devices/otie/protocol-runs/1/run-log'
    )
  })
})
