import { UseQueryResult } from 'react-query'
import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { useCurrentRunId } from '../../../ProtocolUpload/hooks'
import * as Alerts from '../../../../redux/alerts'
import { useRobotBusyAndUpdateAlertEnabled } from '..'

import type { Sessions } from '@opentrons/api-client'
import type { State } from '../../../../redux/types'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../ProtocolUpload/hooks')
jest.mock('../../../../redux/alerts')

const MOCK_STATE: State = {} as any

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseAllSessionsQuery = useAllSessionsQuery as jest.MockedFunction<
  typeof useAllSessionsQuery
>
const mockGetAlertIsPermanentlyIgnored = Alerts.getAlertIsPermanentlyIgnored as jest.MockedFunction<
  typeof Alerts.getAlertIsPermanentlyIgnored
>

describe('useRobotBusyAndUpdateAlertEnabled', () => {
  beforeEach(() => {
    mockGetAlertIsPermanentlyIgnored.mockImplementation((state, alertId) => {
      expect(state).toBe(MOCK_STATE)
      expect(alertId).toBe(Alerts.ALERT_APP_UPDATE_AVAILABLE)
      return null
    })
    mockUseCurrentRunId.mockReturnValue('123')
    mockUseAllSessionsQuery.mockReturnValue(({
      data: [],
      links: null,
    } as unknown) as UseQueryResult<Sessions, Error>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns isRobotBusy true and isUpdateAlertEnabled null when current runId is not null and getAlertIsPermanentlyIgnored is null', () => {
    const result = useRobotBusyAndUpdateAlertEnabled()
    expect(result).toBe({ isRobotBusy: true, isUpdateAlertEnabled: null })
  })

  it('returns isRobotBusy true and isUpdateAlertEnabled false when sessions are empty and getAlertIsPermanentlyIgnored is false', () => {
    mockGetAlertIsPermanentlyIgnored.mockReturnValue(false)
    const result = useRobotBusyAndUpdateAlertEnabled()
    expect(result).toBe({ isRobotBusy: true, isUpdateAlertEnabled: false })
  })

  it('returns isRobotBusy false and isUpdateAlertEnabled true when current runId is null and sessions are not empty and getAlertIsPermanentlyIgnored is true', () => {
    mockGetAlertIsPermanentlyIgnored.mockReturnValue(true)
    mockUseCurrentRunId.mockReturnValue(null)
    mockUseAllSessionsQuery.mockReturnValue(({
      data: [
        {
          id: 'test',
          createdAt: '2019-08-24T14:15:22Z',
          details: {},
          sessionType: 'calibrationCheck',
          createParams: {},
        },
      ],
      links: {},
    } as unknown) as UseQueryResult<Sessions, Error>)
    const result = useRobotBusyAndUpdateAlertEnabled()
    expect(result).toBe({ isRobotBusy: false, isUpdateAlertEnabled: true })
  })
})
