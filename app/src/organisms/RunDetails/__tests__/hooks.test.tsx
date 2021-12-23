import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { when, resetAllWhenMocks } from 'jest-when'
import { useHost, useRunQuery } from '@opentrons/react-api-client'
import { useCurrentRunId } from '../../ProtocolUpload/hooks/useCurrentRunId'
import { renderHook } from '@testing-library/react-hooks'
import { useCommandDetailsById, REFETCH_INTERVAL } from '../hooks'

jest.mock('@opentrons/react-api-client')
jest.mock('../../ProtocolUpload/hooks/useCurrentRunId')

const mockUseHost = useHost as jest.MockedFunction<typeof useHost>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>

const wrapper: React.FunctionComponent<{}> = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
)

describe('useCommandDetailsById', () => {
  let MOCK_RUN_ID: string
  beforeEach(() => {
    MOCK_RUN_ID = 'mock_run_id'
    when(mockUseHost)
      .calledWith()
      .mockReturnValue({} as any)
    when(mockUseCurrentRunId).calledWith().mockReturnValue(MOCK_RUN_ID)
    when(mockUseRunQuery)
      .calledWith(MOCK_RUN_ID, { refetchInterval: REFETCH_INTERVAL })
      .mockReturnValue({ data: null } as any)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('should return an empty object when there is no host', () => {
    const { result } = renderHook(useCommandDetailsById, { wrapper })
    expect(result.current).toEqual({})
  })
  it('should return an empty object when there is no run record', () => {})
  it('should return an empty object when there is no current run id', () => {})
})
