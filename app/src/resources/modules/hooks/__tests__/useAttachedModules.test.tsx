import { mockModulesResponse } from '@opentrons/api-client'
import type { Modules } from '@opentrons/api-client'
import { useModulesQuery } from '@opentrons/react-api-client'
import { renderHook } from '@testing-library/react'
import type { FunctionComponent, ReactNode } from 'react'
import type { UseQueryResult } from 'react-query'
import { describe, expect, it, vi } from 'vitest'
import { useAttachedModules } from '..'

vi.mock('@opentrons/react-api-client')

describe('useAttachedModules hook', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>

  it('returns attached modules', () => {
    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: mockModulesResponse },
    } as UseQueryResult<Modules, unknown>)

    const { result } = renderHook(() => useAttachedModules(), { wrapper })

    expect(result.current).toEqual(mockModulesResponse)
  })
})
