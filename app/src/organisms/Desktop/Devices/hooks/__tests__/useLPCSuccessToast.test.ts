import * as React from 'react'
import { vi, it, expect, describe } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLPCSuccessToast } from '..'
import type * as ReactType from 'react'

vi.mock('react', async importOriginal => {
  const actualReact = await importOriginal<typeof ReactType>()
  return {
    ...actualReact,
    useContext: vi.fn(),
  }
})

describe('useLPCSuccessToast', () => {
  it('return true when useContext returns true', () => {
    vi.mocked(React.useContext).mockReturnValue({
      setIsShowingLPCSuccessToast: true,
    })
    const { result } = renderHook(() => useLPCSuccessToast())
    expect(result.current).toStrictEqual({
      setIsShowingLPCSuccessToast: true,
    })
  })
  it('return false when useContext returns false', () => {
    vi.mocked(React.useContext).mockReturnValue({
      setIsShowingLPCSuccessToast: false,
    })
    const { result } = renderHook(() => useLPCSuccessToast())
    expect(result.current).toStrictEqual({
      setIsShowingLPCSuccessToast: false,
    })
  })
})
