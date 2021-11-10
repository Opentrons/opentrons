import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'
import { useAllRunsQuery } from '@opentrons/react-api-client'
import { useMostRecentRunId } from '../useMostRecentRunId'

jest.mock('@opentrons/react-api-client')

const mockUseAllRunsQuery = useAllRunsQuery as jest.MockedFunction<typeof useAllRunsQuery>

describe('useMostRecentRunId hook', () => {
  let wrapper: React.FunctionComponent<{}>

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return the first run if any runs exist', async () => {
    when(mockUseAllRunsQuery)
      .calledWith()
      .mockReturnValue({data: {data: [{id: 'some_run_id'}]}} as any)

    const { result, waitFor } = renderHook(useMostRecentRunId)

    expect(result.current).toBe('some_run_id')
  })

  it('should return null if no runs exist', async () => {
    when(mockUseAllRunsQuery)
      .calledWith()
      .mockReturnValue({data: {data: []}} as any)

    const { result, waitFor } = renderHook(useMostRecentRunId)

    expect(result.current).toBeNull()
  })
})
