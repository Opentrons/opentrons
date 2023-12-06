import { resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react'
import { mockModulesResponse } from '@opentrons/api-client'
import { useModulesQuery } from '@opentrons/react-api-client'
import { useAttachedModules } from '..'

import type { Modules } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')

const mockUseModulesQuery = useModulesQuery as jest.MockedFunction<
  typeof useModulesQuery
>

describe('useAttachedModules hook', () => {
  let wrapper: React.FunctionComponent<{children: React.ReactNode}>
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns attached modules', () => {
    mockUseModulesQuery.mockReturnValue({
      data: { data: mockModulesResponse },
    } as UseQueryResult<Modules, unknown>)

    const { result } = renderHook(() => useAttachedModules(), { wrapper })

    expect(result.current).toEqual(mockModulesResponse)
  })
})
