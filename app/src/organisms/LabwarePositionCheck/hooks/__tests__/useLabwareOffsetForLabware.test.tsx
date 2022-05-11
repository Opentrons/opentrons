import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { createStore, Store } from 'redux'
import { Provider } from 'react-redux'
import { when, resetAllWhenMocks } from 'jest-when'
import { TEMPERATURE_MODULE_V2 } from '@opentrons/shared-data'
import noModulesProtocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import { renderHook } from '@testing-library/react-hooks'
import { useRunQuery } from '@opentrons/react-api-client'
import { useProtocolDetailsForRun, } from '../../../Devices/hooks'
import { useLabwareOffsetForLabware } from '../useLabwareOffsetForLabware'

import type { LabwareOffset } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../Devices/hooks')

const queryClient = new QueryClient()
const store: Store<any> = createStore(jest.fn(), {})
const wrapper: React.FunctionComponent<{}> = ({ children }) => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </Provider>
)

const mockOffset: LabwareOffset = {
  id: 'fakeOffsetId',
  createdAt: 'fakeTimestamp',
  location: { slotName: '8' },
  definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
  vector: { x: 1, y: 2, z: 3 },
}
const mockOffsetOnMod: LabwareOffset = {
  id: 'fakeOffsetIdOnMod',
  location: { slotName: '3', moduleModel: TEMPERATURE_MODULE_V2},
  vector: { x: 4, y: 5, z: 6 },
  createdAt: 'fakeTimestamp',
  definitionUri: 'fakeDefUri',
}
const MOCK_RUN_ID = 'MOCK_RUN_ID'

const mockUseRunQuery = useRunQuery as jest.MockedFunction<
  typeof useRunQuery
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>

describe('useLabwareOffsetForLabware', () => {

  beforeEach(() => {
    when(mockUseRunQuery)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({ data: {labwareOffsets: [mockOffsetOnMod, mockOffset]}} as any)
    when(mockUseProtocolDetailsForRun)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({ protocolData: noModulesProtocol} as any)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('should return current offsets associated with given labwareId in protocol', async () => {
    const { result } = renderHook(
      () => useLabwareOffsetForLabware(MOCK_RUN_ID, 'tiprackId'),
      { wrapper }
    )
    expect(result.current).toEqual(mockOffset)
  })
})
