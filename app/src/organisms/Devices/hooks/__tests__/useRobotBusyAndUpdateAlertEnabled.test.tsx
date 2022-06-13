import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { useAllSessionsQuery } from '@opentrons/react-api-client'
import { renderHook } from '@testing-library/react-hooks'
import { getAlertIsPermanentlyIgnored } from '../../../../redux/alerts'
import { useCurrentRunId } from '../../../ProtocolUpload/hooks'
import { useRobotBusyAndUpdateAlertEnabled } from '..'

import type { Sessions } from '@opentrons/api-client'
import type { UseQueryResult } from 'react-query'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../ProtocolUpload/hooks')
jest.mock('../../../../redux/alerts')

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseAllSessionsQuery = useAllSessionsQuery as jest.MockedFunction<
  typeof useAllSessionsQuery
>
const mockGetAlertIsPermanentlyIgnored = getAlertIsPermanentlyIgnored as jest.MockedFunction<
  typeof getAlertIsPermanentlyIgnored
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useRobotBusyAndUpdateAlertEnabled', () => {
  let wrapper: React.FunctionComponent<{}>

  beforeEach(() => {
    mockGetAlertIsPermanentlyIgnored.mockReturnValue(null)
    mockUseCurrentRunId.mockReturnValue('123')
    mockUseAllSessionsQuery.mockReturnValue(({
      data: [],
      links: null,
    } as unknown) as UseQueryResult<Sessions, Error>)
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns isRobotBusy true and isUpdateAlertEnabled true when current runId is not null and getAlertIsPermanentlyIgnored is null', () => {
    const { result } = renderHook(() => useRobotBusyAndUpdateAlertEnabled(), {
      wrapper,
    })

    expect(result.current.isRobotBusy).toBe(true)
    expect(result.current.isUpdateAlertEnabled).toBe(null)
  })

  it('returns isRobotBusy true and isUpdateAlertEnabled true when sessions are empty and getAlertIsPermanentlyIgnored is false', () => {
    mockGetAlertIsPermanentlyIgnored.mockReturnValue(false)
    const { result } = renderHook(() => useRobotBusyAndUpdateAlertEnabled(), {
      wrapper,
    })
    expect(result.current.isRobotBusy).toBe(true)
    expect(result.current.isUpdateAlertEnabled).toBe(true)
  })

  it('returns isRobotBusy false and isUpdateAlertEnabled false when current runId is null and sessions are not empty and getAlertIsPermanentlyIgnored is true', () => {
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
    const { result } = renderHook(() => useRobotBusyAndUpdateAlertEnabled(), {
      wrapper,
    })
    expect(result.current.isRobotBusy).toBe(false)
    expect(result.current.isUpdateAlertEnabled).toBe(false)
  })
})
