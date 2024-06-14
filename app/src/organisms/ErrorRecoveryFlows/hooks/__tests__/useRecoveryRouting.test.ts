import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import {
  usePreviousRecoveryRoute,
  useRecoveryRouting,
} from '../useRecoveryRouting'
import { RECOVERY_MAP } from '../../constants'

import type { IRecoveryMap } from '../../types'

describe('useRecoveryRouting', () => {
  it('should initialize with the default recovery map', () => {
    const { result } = renderHook(() => useRecoveryRouting())

    expect(result.current.recoveryMap).toEqual({
      route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
      step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
    })
  })

  it('should update the recovery map correctly', () => {
    const { result } = renderHook(() => useRecoveryRouting())

    const newRecoveryMap = {
      route: RECOVERY_MAP.BEFORE_BEGINNING.ROUTE,
      step: RECOVERY_MAP.BEFORE_BEGINNING.STEPS.RECOVERY_DESCRIPTION,
    } as IRecoveryMap

    act(() => {
      result.current.setRM(newRecoveryMap)
    })

    expect(result.current.recoveryMap).toEqual(newRecoveryMap)
  })
})

const { BEFORE_BEGINNING, DROP_TIP_FLOWS, OPTION_SELECTION } = RECOVERY_MAP

describe('usePreviousRecoveryRoute', () => {
  it('should initialize with null as the previous route', () => {
    const { result } = renderHook(() =>
      usePreviousRecoveryRoute(BEFORE_BEGINNING.ROUTE)
    )

    expect(result.current).toBeNull()
  })

  it('should update the previous route when the current route changes', () => {
    const { result, rerender } = renderHook(
      route => usePreviousRecoveryRoute(route),
      {
        initialProps: BEFORE_BEGINNING.ROUTE as any,
      }
    )

    expect(result.current).toBeNull()

    act(() => {
      rerender(DROP_TIP_FLOWS.ROUTE)
    })

    expect(result.current).toBe(BEFORE_BEGINNING.ROUTE)

    act(() => rerender(OPTION_SELECTION.ROUTE))

    expect(result.current).toBe(DROP_TIP_FLOWS.ROUTE)
  })

  it('should not update the previous route if the current route remains the same', () => {
    const { result, rerender } = renderHook(
      route => usePreviousRecoveryRoute(route),
      {
        initialProps: BEFORE_BEGINNING.ROUTE as any,
      }
    )

    expect(result.current).toBeNull()

    act(() => {
      rerender(BEFORE_BEGINNING.ROUTE)
    })

    expect(result.current).toBeNull()

    act(() => {
      rerender(DROP_TIP_FLOWS.ROUTE)
    })

    expect(result.current).toBe(BEFORE_BEGINNING.ROUTE)

    act(() => {
      rerender(DROP_TIP_FLOWS.ROUTE)
    })

    expect(result.current).toBe(BEFORE_BEGINNING.ROUTE)
  })
})
