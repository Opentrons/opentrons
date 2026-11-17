import { I18nextProvider } from 'react-i18next'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WARNING_TOAST, Z_INDEX } from '@opentrons/components'

import { i18n } from '/app/i18n'
// eslint-disable-next-line opentrons/no-imports-across-applications
import { useToaster } from '/app/organisms/ToasterOven'

import { useInsufficientPermissionsToast } from '../useInsufficientPermissionsToast'

import type { FunctionComponent, ReactNode } from 'react'

vi.mock('/app/organisms/ToasterOven')

const mockMakeToast = vi.fn()
const mockEatToast = vi.fn()

const wrapper: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
)

describe('useInsufficientPermissionsToast', () => {
  beforeEach(() => {
    mockMakeToast.mockReset()
    mockEatToast.mockReset()
    mockMakeToast.mockReturnValueOnce('toast-1').mockReturnValueOnce('toast-2')
    vi.mocked(useToaster).mockReturnValue({
      makeToast: mockMakeToast,
      eatToast: mockEatToast,
      makeSnackbar: vi.fn(),
    })
  })

  it('pops the additional permissions toast', () => {
    const { result } = renderHook(() => useInsufficientPermissionsToast(), {
      wrapper,
    })

    act(() => {
      result.current.popToast()
    })

    expect(mockMakeToast).toHaveBeenCalledWith(
      'Log in with an authorized account.',
      WARNING_TOAST,
      expect.objectContaining({
        closeButton: true,
        disableTimeout: true,
        heading: 'Additional permissions required',
        zIndex: Z_INDEX.LOGIN_TOASTS,
      })
    )
  })

  it('replaces an existing toast instead of stacking', () => {
    const { result } = renderHook(() => useInsufficientPermissionsToast(), {
      wrapper,
    })

    act(() => {
      result.current.popToast()
    })
    act(() => {
      result.current.popToast()
    })

    expect(mockEatToast).toHaveBeenCalledWith('toast-1')
    expect(mockMakeToast).toHaveBeenCalledTimes(2)
  })

  it('eats the current toast only once', () => {
    const { result } = renderHook(() => useInsufficientPermissionsToast(), {
      wrapper,
    })

    act(() => {
      result.current.popToast()
    })
    act(() => {
      result.current.eatToast()
      result.current.eatToast()
    })

    expect(mockEatToast).toHaveBeenCalledTimes(1)
    expect(mockEatToast).toHaveBeenCalledWith('toast-1')
  })
})
