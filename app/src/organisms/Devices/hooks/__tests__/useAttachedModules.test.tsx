import { resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { mockModulesResponse, AttachedModules } from '@opentrons/api-client'
import { useModulesQuery } from '@opentrons/react-api-client'
import { useAttachedModules } from '..'

jest.mock('@opentrons/react-api-client')

const mockUseModulesQuery = useModulesQuery as jest.MockedFunction<
  typeof useModulesQuery
>

describe('useAttachedModules hook', () => {
  let wrapper: React.FunctionComponent<{}>
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns attached modules', () => {
    mockUseModulesQuery.mockReturnValue({
      data: { data: mockModulesResponse },
    } as UseQueryResult<AttachedModules, unknown>)

    const { result } = renderHook(() => useAttachedModules(), { wrapper })

    expect(result.current).toEqual(mockModulesResponse)
  })
})
