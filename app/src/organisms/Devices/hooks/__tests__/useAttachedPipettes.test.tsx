import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react'
import { usePipettesQuery } from '@opentrons/react-api-client'
import * as SharedData from '@opentrons/shared-data'
import { useAttachedPipettes } from '../useAttachedPipettes'
import {
  pipetteResponseFixtureLeft,
  pipetteResponseFixtureRight,
} from '@opentrons/api-client'
import type { FetchPipettesResponseBody } from '@opentrons/api-client'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client')

const mockUsePipettesQuery = usePipettesQuery as jest.MockedFunction<
  typeof usePipettesQuery
>
const mockGetPipetteModelSpecs = SharedData.getPipetteModelSpecs as jest.MockedFunction<
  typeof SharedData.getPipetteModelSpecs
>

jest.mock('@opentrons/shared-data', () => ({
  ...SharedData,
  getPipetteModelSpecs: mockGetPipetteModelSpecs,
}))

describe('useAttachedPipettes hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  beforeEach(() => {
    mockGetPipetteModelSpecs.mockReturnValue({
      name: 'mockName',
    } as PipetteModelSpecs)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns attached pipettes', () => {
    when(mockUsePipettesQuery)
      .calledWith({}, {})
      .mockReturnValue({
        data: {
          left: pipetteResponseFixtureLeft,
          right: pipetteResponseFixtureRight,
        },
      } as UseQueryResult<FetchPipettesResponseBody, unknown>)

    const { result } = renderHook(() => useAttachedPipettes(), {
      wrapper,
    })

    expect(result.current).toEqual({
      left: { ...pipetteResponseFixtureLeft, modelSpecs: { name: 'mockName' } },
      right: {
        ...pipetteResponseFixtureRight,
        modelSpecs: { name: 'mockName' },
      },
    })
  })

  it('returns attached pipettes polled every 5 seconds if poll true', () => {
    when(mockUsePipettesQuery)
      .calledWith({}, { refetchInterval: 5000 })
      .mockReturnValue({
        data: {
          left: pipetteResponseFixtureLeft,
          right: pipetteResponseFixtureRight,
        },
      } as UseQueryResult<FetchPipettesResponseBody, unknown>)

    const { result } = renderHook(() => useAttachedPipettes(true), {
      wrapper,
    })

    expect(result.current).toEqual({
      left: { ...pipetteResponseFixtureLeft, modelSpecs: { name: 'mockName' } },
      right: {
        ...pipetteResponseFixtureRight,
        modelSpecs: { name: 'mockName' },
      },
    })
  })
})
