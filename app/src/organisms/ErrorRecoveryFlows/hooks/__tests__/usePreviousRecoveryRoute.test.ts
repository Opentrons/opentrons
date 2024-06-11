import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { usePreviousRecoveryRoute } from '../usePreviousRecoveryRoute'
import { RECOVERY_MAP } from '../../constants'

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
