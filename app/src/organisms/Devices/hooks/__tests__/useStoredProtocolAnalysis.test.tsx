import * as React from 'react'
import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { QueryClient, QueryClientProvider, UseQueryResult } from 'react-query'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react'

import {
  parseRequiredModulesEntity,
  parseInitialLoadedLabwareEntity,
  parsePipetteEntity,
} from '@opentrons/api-client'
import { useProtocolQuery } from '@opentrons/react-api-client'

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
import { useNotifyRunQuery } from '../../../../resources/runs'

import type { Protocol, Run } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('@opentrons/react-api-client')
vi.mock('../../../../redux/protocol-storage/selectors')
vi.mock('../../../../resources/runs')

const store: Store<any> = createStore(vi.fn(), {})

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

    when(vi.mocked(useNotifyRunQuery))
      .calledWith(null, { staleTime: Infinity })
      .thenReturn({} as UseQueryResult<Run>)
    when(vi.mocked(useProtocolQuery))
      .calledWith(null, { staleTime: Infinity })
      .thenReturn({} as UseQueryResult<Protocol>)
    when(vi.mocked(getStoredProtocol))
      .calledWith(undefined as any)
      .thenReturn(null)
    vi.mocked(parseRequiredModulesEntity).mockReturnValue([MODULE_ENTITY])
    vi.mocked(parseInitialLoadedLabwareEntity).mockReturnValue([LABWARE_ENTITY])
    vi.mocked(parsePipetteEntity).mockReturnValue([PIPETTE_ENTITY])
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns null when called with null', () => {
    const { result } = renderHook(() => useStoredProtocolAnalysis(null), {
      wrapper,
    })

    expect(result.current).toEqual(null)
  })

  it('returns null when there is no stored protocol analysis for a protocol key', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID, { staleTime: Infinity })
      .thenReturn({
        data: { data: { protocolId: PROTOCOL_ID } },
      } as UseQueryResult<Run>)
    when(vi.mocked(useProtocolQuery))
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .thenReturn({
        data: { data: { key: PROTOCOL_KEY } },
      } as UseQueryResult<Protocol>)
    when(vi.mocked(getStoredProtocol))
      .calledWith(undefined as any, PROTOCOL_KEY)
      .thenReturn(null)

    const { result } = renderHook(() => useStoredProtocolAnalysis(RUN_ID), {
      wrapper,
    })

    expect(result.current).toEqual(null)
  })

  it('returns a stored protocol analysis when one exists for a protocol key', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID, { staleTime: Infinity })
      .thenReturn({
        data: { data: { protocolId: PROTOCOL_ID } },
      } as UseQueryResult<Run>)
    when(vi.mocked(useProtocolQuery))
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .thenReturn({
        data: { data: { key: PROTOCOL_KEY } },
      } as UseQueryResult<Protocol>)
    when(vi.mocked(getStoredProtocol))
      .calledWith(undefined as any, PROTOCOL_KEY)
      .thenReturn(modifiedStoredProtocolData as StoredProtocolData)

    const { result } = renderHook(() => useStoredProtocolAnalysis(RUN_ID), {
      wrapper,
    })

    expect(result.current).toEqual(STORED_PROTOCOL_ANALYSIS)
  })
})
