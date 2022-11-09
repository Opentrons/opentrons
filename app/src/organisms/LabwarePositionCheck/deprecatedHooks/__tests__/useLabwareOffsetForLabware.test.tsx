import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { createStore, Store } from 'redux'
import { Provider } from 'react-redux'
import { when, resetAllWhenMocks } from 'jest-when'
import { simpleAnalysisFileFixture } from '@opentrons/api-client'
import { schemaV6Adapter, TEMPERATURE_MODULE_V2 } from '@opentrons/shared-data'
import { renderHook } from '@testing-library/react-hooks'
import { useRunQuery } from '@opentrons/react-api-client'
import { useProtocolDetailsForRun } from '../../../Devices/hooks'
import { useLabwareOffsetForLabware } from '../useLabwareOffsetForLabware'
import type { LabwareOffset } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../Devices/hooks')
const mockAnalysis: CompletedProtocolAnalysis = {
  ...simpleAnalysisFileFixture,
  status: 'completed',
} as any
const mockProtocolDetails = schemaV6Adapter(mockAnalysis)
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
  location: { slotName: '2' },
  definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
  vector: { x: 1, y: 2, z: 3 },
}
const mockOffsetOnMod: LabwareOffset = {
  id: 'fakeOffsetIdOnMod',
  location: { slotName: '3', moduleModel: TEMPERATURE_MODULE_V2 },
  vector: { x: 4, y: 5, z: 6 },
  createdAt: 'fakeTimestamp',
  definitionUri: 'fakeDefUri',
}
const MOCK_RUN_ID = 'MOCK_RUN_ID'

const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>

describe('useLabwareOffsetForLabware', () => {
  beforeEach(() => {
    when(mockUseRunQuery)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        data: { data: { labwareOffsets: [mockOffsetOnMod, mockOffset] } },
      } as any)
    when(mockUseProtocolDetailsForRun)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        protocolData: mockProtocolDetails,
      } as any)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('should return current offsets associated with given labwareId in protocol', async () => {
    const { result } = renderHook(
      () => useLabwareOffsetForLabware(MOCK_RUN_ID, 'labware-1'),
      { wrapper }
    )
    expect(result.current).toEqual(mockOffset)
  })
  it('should return no offsets if labware and location do not have offset associated', async () => {
    const { result } = renderHook(
      () => useLabwareOffsetForLabware(MOCK_RUN_ID, 'labware-0'),
      { wrapper }
    )
    expect(result.current).toEqual(null)
  })
  it('should return newest offset if multiple match labware and location of supplied labwareId', async () => {
    const newerTimestamp = '2022-05-10T15:30:02.708775+00:00'
    const olderTimestamp = '2020-05-10T15:30:02.708775+00:00'
    when(mockUseRunQuery)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        data: {
          data: {
            labwareOffsets: [
              { ...mockOffset, createdAt: olderTimestamp },
              { ...mockOffset, createdAt: newerTimestamp },
            ],
          },
        },
      } as any)
    const { result } = renderHook(
      () => useLabwareOffsetForLabware(MOCK_RUN_ID, 'labware-1'),
      { wrapper }
    )
    expect(result.current?.createdAt).toEqual(newerTimestamp)
  })
})
