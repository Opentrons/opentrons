import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'

import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'

import {
  PROTOCOL_ID,
  RUN_ID_2,
  mockIdleUnstartedRun,
} from '../../../../organisms/RunTimeControl/__fixtures__'

import { useProtocolForRun } from '..'

import type { Protocol, Run } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')

const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>

const PROTOCOL_RESPONSE = {
  data: {
    protocolType: 'json',
    createdAt: 'now',
    id: '1',
    metadata: {},
    analyses: {},
  },
} as Protocol

describe('useProtocolForRun hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns null when given a null run id', async () => {
    when(mockUseRunQuery)
      .calledWith(null)
      .mockReturnValue({} as UseQueryResult<Run>)
    when(mockUseProtocolQuery)
      .calledWith(null, { staleTime: Infinity }, true)
      .mockReturnValue({} as UseQueryResult<Protocol>)

    const { result } = renderHook(() => useProtocolForRun(null))
    expect(result.current).toBe(null)
  })

  it('returns the protocol record when given a run id', async () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2)
      .mockReturnValue({
        data: { data: mockIdleUnstartedRun },
      } as UseQueryResult<Run>)
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity }, true)
      .mockReturnValue({ data: PROTOCOL_RESPONSE } as UseQueryResult<Protocol>)

    const { result } = renderHook(() => useProtocolForRun(RUN_ID_2))
    expect(result.current).toBe(PROTOCOL_RESPONSE)
  })
})
