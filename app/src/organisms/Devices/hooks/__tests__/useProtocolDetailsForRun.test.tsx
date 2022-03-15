import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'

import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import { schemaV6Adapter } from '@opentrons/shared-data'

import { useProtocolDetailsForRun, useProtocolForRun } from '..'

import { RUN_ID_2 } from '../../../../organisms/RunTimeControl/__fixtures__'

import type { Protocol } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  ProtocolFile,
} from '@opentrons/shared-data'

jest.mock('../useProtocolForRun')
jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    schemaV6Adapter: jest.fn(),
  }
})

const mockUseProtocolForRun = useProtocolForRun as jest.MockedFunction<
  typeof useProtocolForRun
>
const mockSchemaV6Adapter = schemaV6Adapter as jest.MockedFunction<
  typeof schemaV6Adapter
>

const PROTOCOL_RESPONSE = {
  data: {
    protocolType: 'json',
    createdAt: 'now',
    id: '1',
    metadata: { protocolName: 'fake protocol' },
    analyses: [{ id: 'fake analysis', status: 'completed' }],
  },
} as Protocol

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolFile<{}>

describe('useProtocolDetailsForRun hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns null when given a null run id', async () => {
    when(mockUseProtocolForRun).calledWith(null).mockReturnValue(null)

    const { result } = renderHook(() => useProtocolDetailsForRun(null))
    expect(result.current).toStrictEqual({
      displayName: null,
      protocolData: null,
    })
  })

  it('returns the protocol file when given a run id', async () => {
    when(mockUseProtocolForRun)
      .calledWith(RUN_ID_2)
      .mockReturnValue(PROTOCOL_RESPONSE)
    when(mockSchemaV6Adapter)
      .calledWith({
        id: 'fake analysis',
        status: 'completed',
      } as CompletedProtocolAnalysis)
      .mockReturnValue(simpleV6Protocol)

    const { result } = renderHook(() => useProtocolDetailsForRun(RUN_ID_2))
    expect(result.current).toStrictEqual({
      displayName: 'fake protocol',
      protocolData: simpleV6Protocol,
    })
  })
})
