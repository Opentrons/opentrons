import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { RUN_STATUS_RUNNING } from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { useCurrentRunId } from '../../../organisms/ProtocolUpload/hooks'
import { useCurrentRunStatus } from '../../../organisms/RunTimeControl/hooks'

import { RobotStatusHeader } from '../RobotStatusHeader'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../organisms/ProtocolUpload/hooks')
jest.mock('../../../organisms/RunTimeControl/hooks')
jest.mock('../hooks')

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseCurrentRunStatus = useCurrentRunStatus as jest.MockedFunction<
  typeof useCurrentRunStatus
>
const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>

const render = (props: React.ComponentProps<typeof RobotStatusHeader>) => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotStatusHeader {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}
describe('RobotStatusHeader', () => {
  let props: React.ComponentProps<typeof RobotStatusHeader>

  beforeEach(() => {
    props = {
      name: 'otie',
      local: true,
      robotModel: 'OT-2',
    }
    when(mockUseCurrentRunId).calledWith().mockReturnValue(null)
    when(mockUseCurrentRunStatus).calledWith().mockReturnValue(null)
    when(mockUseRunQuery)
      .calledWith(null, { staleTime: Infinity })
      .mockReturnValue({} as any)
    when(mockUseRunQuery)
      .calledWith('fakeRunId', { staleTime: Infinity })
      .mockReturnValue({
        data: {
          data: { protocolId: 'fakeProtocolId' },
        },
      } as any)
    when(mockUseProtocolQuery)
      .calledWith(null, { staleTime: Infinity })
      .mockReturnValue({} as any)
    when(mockUseProtocolQuery)
      .calledWith('fakeProtocolId', { staleTime: Infinity })
      .mockReturnValue({
        data: {
          data: {
            metadata: { protocolName: 'fake protocol name' },
          },
        },
      } as any)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders the model of robot and robot name - OT-2', () => {
    const [{ getByText }] = render(props)
    getByText('OT-2')
    getByText('otie')
  })

  it('renders the model of robot and robot name - OT-3', () => {
    props.name = 'buzz'
    props.robotModel = 'OT-3'
    const [{ getByText }] = render(props)
    getByText('OT-3')
    getByText('buzz')
  })

  it('does not render a running protocol banner when a protocol is not running', () => {
    const [{ queryByText }] = render(props)

    expect(queryByText('fake protocol name;')).toBeFalsy()
    expect(queryByText('Go to Run')).toBeFalsy()
  })

  it('renders a running protocol banner when a protocol is running', () => {
    when(mockUseCurrentRunId).calledWith().mockReturnValue('fakeRunId')
    when(mockUseCurrentRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_RUNNING)

    const [{ getByRole, getByText }] = render(props)

    getByText('fake protocol name; Running')

    const runLink = getByRole('link', { name: 'Go to Run' })
    expect(runLink.getAttribute('href')).toEqual(
      '/devices/otie/protocol-runs/fakeRunId/run-log'
    )
  })
})
