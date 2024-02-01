import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider, UseQueryResult } from 'react-query'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react'

import {
  parseRequiredModulesEntity,
  parseInitialLoadedLabwareEntity,
  parsePipetteEntity,
} from '@opentrons/api-client'
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'

import { storedProtocolData } from '../../../../redux/protocol-storage/__fixtures__'
import {
  getStoredProtocol,
  StoredProtocolData,
} from '../../../../redux/protocol-storage'
import { useStoredProtocolAnalysis } from '../useStoredProtocolAnalysis'
import {
  LABWARE_ENTITY,
  MODULE_ENTITY,
  PIPETTE_ENTITY,
  STORED_PROTOCOL_ANALYSIS,
} from '../__fixtures__/storedProtocolAnalysis'

import type { Protocol, Run } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('@opentrons/react-api-client')
jest.mock('../../../../redux/protocol-storage/selectors')

const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockGetStoredProtocol = getStoredProtocol as jest.MockedFunction<
  typeof getStoredProtocol
>
const mockParseRequiredModulesEntity = parseRequiredModulesEntity as jest.MockedFunction<
  typeof parseRequiredModulesEntity
>
const mockParseInitialLoadedLabwareEntity = parseInitialLoadedLabwareEntity as jest.MockedFunction<
  typeof parseInitialLoadedLabwareEntity
>
const mockParsePipetteEntity = parsePipetteEntity as jest.MockedFunction<
  typeof parsePipetteEntity
>
const store: Store<any> = createStore(jest.fn(), {})

const modifiedStoredProtocolData = {
  ...storedProtocolData,
  mostRecentAnalysis: {
    commands: storedProtocolData?.mostRecentAnalysis?.commands,
    liquids: storedProtocolData?.mostRecentAnalysis?.liquids,
    errors: storedProtocolData?.mostRecentAnalysis?.errors,
  },
}

const RUN_ID = 'the_run_id'
const PROTOCOL_ID = 'the_protocol_id'
const PROTOCOL_KEY = 'the_protocol_key'

describe('useStoredProtocolAnalysis hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )

    when(mockUseRunQuery)
      .calledWith(null, { staleTime: Infinity })
      .mockReturnValue({} as UseQueryResult<Run>)
    when(mockUseProtocolQuery)
      .calledWith(null, { staleTime: Infinity })
      .mockReturnValue({} as UseQueryResult<Protocol>)
    when(mockGetStoredProtocol)
      .calledWith(undefined as any)
      .mockReturnValue(null)
    when(mockParseRequiredModulesEntity).mockReturnValue([MODULE_ENTITY])
    when(mockParseInitialLoadedLabwareEntity).mockReturnValue([LABWARE_ENTITY])
    when(mockParsePipetteEntity).mockReturnValue([PIPETTE_ENTITY])
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns null when called with null', () => {
    const { result } = renderHook(() => useStoredProtocolAnalysis(null), {
      wrapper,
    })

    expect(result.current).toEqual(null)
  })

  it('returns null when there is no stored protocol analysis for a protocol key', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { protocolId: PROTOCOL_ID } },
      } as UseQueryResult<Run>)
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { key: PROTOCOL_KEY } },
      } as UseQueryResult<Protocol>)
    when(mockGetStoredProtocol)
      .calledWith(undefined as any, PROTOCOL_KEY)
      .mockReturnValue(null)

    const { result } = renderHook(() => useStoredProtocolAnalysis(RUN_ID), {
      wrapper,
    })

    expect(result.current).toEqual(null)
  })

  it('returns a stored protocol analysis when one exists for a protocol key', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { protocolId: PROTOCOL_ID } },
      } as UseQueryResult<Run>)
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: { data: { key: PROTOCOL_KEY } },
      } as UseQueryResult<Protocol>)
    when(mockGetStoredProtocol)
      .calledWith(undefined as any, PROTOCOL_KEY)
      .mockReturnValue(modifiedStoredProtocolData as StoredProtocolData)

    const { result } = renderHook(() => useStoredProtocolAnalysis(RUN_ID), {
      wrapper,
    })

    expect(result.current).toEqual(STORED_PROTOCOL_ANALYSIS)
  })
})
