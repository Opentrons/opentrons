import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useShowDoorInfo } from '../useShowDoorInfo'
import {
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
  RUN_STATUS_AWAITING_RECOVERY,
} from '@opentrons/api-client'

describe('useShowDoorInfo', () => {
  let initialProps: Parameters<typeof useShowDoorInfo>[0]

  beforeEach(() => {
    initialProps = RUN_STATUS_AWAITING_RECOVERY
  })

  it('should return false initially', () => {
    const { result } = renderHook(() => useShowDoorInfo(initialProps))
    expect(result.current).toBe(false)
  })

  it(`should return true when runStatus is ${RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR}`, () => {
    const props = RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR

    const { result } = renderHook(() => useShowDoorInfo(props))
    expect(result.current).toBe(true)
  })

  it(`should return true when runStatus is ${RUN_STATUS_AWAITING_RECOVERY_PAUSED}`, () => {
    const props = RUN_STATUS_AWAITING_RECOVERY_PAUSED

    const { result } = renderHook(() => useShowDoorInfo(props))
    expect(result.current).toBe(true)
  })

  it(`should keep returning true when runStatus changes from ${RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR} to ${RUN_STATUS_AWAITING_RECOVERY_PAUSED}`, () => {
    const { result, rerender } = renderHook(props => useShowDoorInfo(props), {
      initialProps,
    })

    act(() => {
      rerender(RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR)
    })
    expect(result.current).toBe(true)

    act(() => {
      rerender(RUN_STATUS_AWAITING_RECOVERY_PAUSED)
    })
    expect(result.current).toBe(true)
  })
})
