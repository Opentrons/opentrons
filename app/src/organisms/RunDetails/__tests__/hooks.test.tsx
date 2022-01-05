import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { when, resetAllWhenMocks } from 'jest-when'
import { useHost, useRunQuery } from '@opentrons/react-api-client'
import { useCurrentRunId } from '../../ProtocolUpload/hooks/useCurrentRunId'
import { renderHook } from '@testing-library/react-hooks'
import { useCommandDetailsById, REFETCH_INTERVAL } from '../hooks'

jest.mock('@opentrons/react-api-client')
jest.mock('@opentrons/api-client')
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
  let MOCK_HOST: any
  beforeEach(() => {
    MOCK_RUN_ID = 'mock_run_id'
    MOCK_HOST = {}
    when(mockUseHost).calledWith().mockReturnValue(MOCK_HOST)
    when(mockUseCurrentRunId).calledWith().mockReturnValue(MOCK_RUN_ID)
    when(mockUseRunQuery)
      .calledWith(MOCK_RUN_ID, { refetchInterval: REFETCH_INTERVAL })
      .mockReturnValue({ data: {} } as any)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('should return an empty object when there is no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)
    const { result } = renderHook(useCommandDetailsById, { wrapper })
    expect(result.current).toEqual({})
  })
  it('should return an empty object when there is no run record', () => {
    when(mockUseRunQuery)
      .calledWith(MOCK_RUN_ID, { refetchInterval: REFETCH_INTERVAL })
      .mockReturnValue({ data: null } as any)
    const { result } = renderHook(useCommandDetailsById, { wrapper })
    expect(result.current).toEqual({})
  })
  it('should return an empty object when there is no current run id', () => {
    when(mockUseCurrentRunId).calledWith().mockReturnValue(null)
    when(mockUseRunQuery)
      .calledWith(null, { refetchInterval: REFETCH_INTERVAL })
      .mockReturnValue({ data: {} } as any)
    const { result } = renderHook(useCommandDetailsById, { wrapper })
    expect(result.current).toEqual({})
  })
  // TODO: Figure out why the test below is not working. renderHook seems to unmount the hook before internal state updates and I'm not sure why
  it.todo('should fetch the command details of new commands') //, async () => {
  // when(mockUseRunQuery)
  //   .calledWith(MOCK_RUN_ID, { refetchInterval: REFETCH_INTERVAL })
  //   .mockReturnValue({
  //     data: {
  //       data: { commands: [{ id: 'COMMAND_1' }, { id: 'COMMAND_2' }] },
  //     },
  //   } as any)
  // when(mockGetCommand)
  //   .calledWith(MOCK_HOST, MOCK_RUN_ID, 'COMMAND_1')
  //   .mockResolvedValue({ data: 'command 1 data!' } as any)
  // when(mockGetCommand)
  //   .calledWith(MOCK_HOST, MOCK_RUN_ID, 'COMMAND_2')
  //   .mockResolvedValue({ data: 'command 2 data!' } as any)
  // const { result, waitFor } = renderHook(useCommandDetailsById, { wrapper })
  // await waitFor(() => {
  //   expect(result.current).toEqual({
  //     COMMAND_1: 'command 1 data!',
  //     COMMAND_2: 'command 2 data!',
  //   })
  // })
  //   })
})
