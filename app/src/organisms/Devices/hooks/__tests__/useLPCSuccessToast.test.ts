import * as React from 'react'
import { renderHook } from '@testing-library/react'
import { useLPCSuccessToast } from '..'

jest.mock('react', () => {
  const actualReact = jest.requireActual('react')
  return {
    ...actualReact,
    useContext: jest.fn(),
  }
})
const mockUseContext = React.useContext as jest.MockedFunction<
  typeof React.useContext
>

describe('useLPCSuccessToast', () => {
  it('return true when useContext returns true', () => {
    mockUseContext.mockReturnValue({ setIsShowingLPCSuccessToast: true })
    const { result } = renderHook(() => useLPCSuccessToast())
    expect(result.current).toStrictEqual({
      setIsShowingLPCSuccessToast: true,
    })
  })
  it('return false when useContext returns false', () => {
    mockUseContext.mockReturnValue({ setIsShowingLPCSuccessToast: false })
    const { result } = renderHook(() => useLPCSuccessToast())
    expect(result.current).toStrictEqual({
      setIsShowingLPCSuccessToast: false,
    })
  })
})
