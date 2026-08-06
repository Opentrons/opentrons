import { act, fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useActivityListener } from '../useActivityListener'

describe('useActivityListener', () => {
  it('should call onActivity when a tracked event occurs', () => {
    const onActivity = vi.fn()
    renderHook(() => {
      useActivityListener(onActivity, ['click'])
    })

    act(() => {
      fireEvent.click(document)
    })
    expect(onActivity).toHaveBeenCalledTimes(1)

    act(() => {
      fireEvent.click(document)
    })
    expect(onActivity).toHaveBeenCalledTimes(2)
  })

  it('should not call onActivity after unmount', () => {
    const onActivity = vi.fn()
    const { unmount } = renderHook(() => {
      useActivityListener(onActivity, ['click'])
    })

    act(() => {
      fireEvent.click(document)
    })
    expect(onActivity).toHaveBeenCalledTimes(1)

    unmount()
    act(() => {
      fireEvent.click(document)
    })
    expect(onActivity).toHaveBeenCalledTimes(1)
  })
})
