import * as React from 'react'
import { UseQueryResult } from 'react-query'
import { renderWithProviders } from '@opentrons/components'
import { useAllRunsQuery } from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { useDispatchApiRequest } from '../../../redux/robot-api'
import { useIsRobotViewable, useRunStatuses } from '../hooks'
import { RecentProtocolRuns } from '../RecentProtocolRuns'
import { HistoricalProtocolRun } from '../HistoricalProtocolRun'

import type { Runs } from '@opentrons/api-client'
import type { DispatchApiRequestType } from '../../../redux/robot-api'

jest.mock('@opentrons/react-api-client')
jest.mock('../hooks')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('../HistoricalProtocolRun')
jest.mock('../../../redux/robot-api')

const mockUseIsRobotViewable = useIsRobotViewable as jest.MockedFunction<
  typeof useIsRobotViewable
>
const mockUseAllRunsQuery = useAllRunsQuery as jest.MockedFunction<
  typeof useAllRunsQuery
>
const mockHistoricalProtocolRun = HistoricalProtocolRun as jest.MockedFunction<
  typeof HistoricalProtocolRun
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>
const mockUseRunStatues = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>
const render = () => {
  return renderWithProviders(<RecentProtocolRuns robotName="otie" />, {
    i18nInstance: i18n,
  })
}

describe('RecentProtocolRuns', () => {
  let dispatchApiRequest: DispatchApiRequestType

  beforeEach(() => {
    dispatchApiRequest = jest.fn()
    mockUseRunStatues.mockReturnValue({
      isLegacySessionInProgress: false,
      isRunStill: false,
      isRunTerminal: true,
      isRunIdle: false,
    })
    mockHistoricalProtocolRun.mockReturnValue(
      <div>mock HistoricalProtocolRun</div>
    )
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, ['id']])
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('renders an empty state message when robot is not on the network', () => {
    mockUseIsRobotViewable.mockReturnValue(false)
    const [{ getByText }] = render()

    getByText('Robot must be on the network to see protocol runs')
  })
  it('renders an empty state message when there are no runs', () => {
    mockUseIsRobotViewable.mockReturnValue(true)
    mockUseAllRunsQuery.mockReturnValue({
      data: {},
    } as UseQueryResult<Runs>)
    const [{ getByText }] = render()

    getByText('No protocol runs yet!')
  })
  it('renders table headers if there are runs', () => {
    mockUseIsRobotViewable.mockReturnValue(true)
    mockUseAllRunsQuery.mockReturnValue({
      data: {
        data: [
          {
            createdAt: '2022-05-04T18:24:40.833862+00:00',
            current: false,
            id: 'test_id',
            protocolId: 'test_protocol_id',
            status: 'succeeded',
          },
        ],
      },
    } as UseQueryResult<Runs>)
    const [{ getByText }] = render()
    getByText(`otie's Protocol Runs`)
    getByText('Run')
    getByText('Protocol')
    getByText('Status')
    getByText('Run duration')
    getByText('mock HistoricalProtocolRun')
  })
})
