import { act, fireEvent, renderHook, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useHomePipettes } from '/app/local-resources/instruments'

import { ProtocolDropTipModal } from '../ProtocolDropTipModal'
import { useProtocolDropTipModal } from '../useProtocolDropTipModal'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

vi.mock('/app/local-resources/instruments')

describe('useProtocolDropTipModal', () => {
  let props: Parameters<typeof useProtocolDropTipModal>[0]
  let mockHomePipettes: Mock

  beforeEach(() => {
    props = {
      hasPipetteWithTip: true,
      isPromptDismissed: false,
      isWizardActive: false,
      enableDTWiz: vi.fn(),
      onSkipAndHome: vi.fn(),
      pipetteInfo: {
        pipetteId: '123',
        pipetteName: 'MOCK_NAME',
        mount: 'left',
      },
    }
    mockHomePipettes = vi.fn()

    vi.mocked(useHomePipettes).mockReturnValue({
      homePipettes: mockHomePipettes,
      isHoming: false,
    })
  })

  it('should return initial values', () => {
    const { result } = renderHook(() => useProtocolDropTipModal(props))

    expect(result.current).toEqual({
      showModal: true,
      modalProps: {
        onSkip: expect.any(Function),
        onBeginRemoval: expect.any(Function),
        isPressed: false,
        mount: 'left',
        is96Channel: false,
      },
    })
  })

  it('should update showDTModal when hasPipetteWithTip changes', () => {
    const { result, rerender } = renderHook(() =>
      useProtocolDropTipModal(props)
    )

    expect(result.current.showModal).toBe(true)

    props.hasPipetteWithTip = false
    rerender()

    expect(result.current.showModal).toBe(false)
  })

  it('should show modal when the run is no longer current if a pipette still has a tip', () => {
    const { result } = renderHook(() => useProtocolDropTipModal(props))

    expect(result.current.showModal).toBe(true)
  })

  it('should not show modal when the drop tip prompt is dismissed', () => {
    props.isPromptDismissed = true
    const { result } = renderHook(() => useProtocolDropTipModal(props))

    expect(result.current.showModal).toBe(false)
  })

  it('should hide an open modal when the prompt is later dismissed', () => {
    const { result, rerender } = renderHook(() =>
      useProtocolDropTipModal(props)
    )

    expect(result.current.showModal).toBe(true)

    props.isPromptDismissed = true
    rerender()

    expect(result.current.showModal).toBe(false)
  })

  it('should call homePipettes when onDTModalSkip is called', () => {
    const { result } = renderHook(() => useProtocolDropTipModal(props))

    act(() => {
      result.current.modalProps?.onSkip()
    })

    expect(mockHomePipettes).toHaveBeenCalled()
  })

  it('should call onSkipAndHome on home success', () => {
    let onSuccess: (() => void) | undefined
    vi.mocked(useHomePipettes).mockImplementation(homeProps => {
      onSuccess = homeProps.onSuccess
      return {
        homePipettes: mockHomePipettes,
        isHoming: false,
      }
    })

    renderHook(() => useProtocolDropTipModal(props))

    act(() => {
      onSuccess?.()
    })

    expect(props.onSkipAndHome).toHaveBeenCalled()
  })

  it('should hide the modal while the drop tip wizard is open and show it again after', () => {
    const { result, rerender } = renderHook(
      ({ isWizardActive }) =>
        useProtocolDropTipModal({ ...props, isWizardActive }),
      { initialProps: { isWizardActive: false } }
    )

    expect(result.current.showModal).toBe(true)

    rerender({ isWizardActive: true })
    expect(result.current.showModal).toBe(false)

    rerender({ isWizardActive: false })
    expect(result.current.showModal).toBe(true)
  })

  it('should call toggleDTWiz when onDTModalRemoval is called', () => {
    const { result } = renderHook(() => useProtocolDropTipModal(props))

    act(() => {
      result.current.modalProps?.onBeginRemoval()
    })

    expect(props.enableDTWiz).toHaveBeenCalled()
  })

  it('should set isPressed to true when isHomingPipettes is true', () => {
    vi.mocked(useHomePipettes).mockReturnValue({
      homePipettes: mockHomePipettes,
      isHoming: true,
    })

    const { result } = renderHook(() => useProtocolDropTipModal(props))

    expect(result.current.modalProps?.isPressed).toBe(true)
  })
})

const render = (props: ComponentProps<typeof ProtocolDropTipModal>) => {
  return renderWithProviders(<ProtocolDropTipModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolDropTipModal', () => {
  let props: ComponentProps<typeof ProtocolDropTipModal>

  beforeEach(() => {
    props = {
      onSkip: vi.fn(),
      onBeginRemoval: vi.fn(),
      mount: 'left',
      isPressed: false,
    }
  })

  it('renders the modal with correct content', () => {
    render(props)

    screen.getByText('Remove any attached tips')
    screen.getByText('left pipette')
    screen.getByText(
      /with liquid in the tips may damage it\. You must remove all tips before using the pipette again\./
    )
    screen.getByText('Begin removal')
    screen.getByText('Skip and home pipette')
  })

  it('does not name a mount for a 96-Channel pipette', () => {
    render({ ...props, is96Channel: true })

    expect(screen.queryByText('left pipette', { exact: false })).toBeNull()
    screen.getByText(
      'Homing the pipette with liquid in the tips may damage it. You must remove all tips before using the pipette again.'
    )
  })

  it('renders a spinner and pressed loading state on Begin removal while homing', () => {
    render({ ...props, isPressed: true })

    const beginRemoval = screen.getByRole('button', { name: /Begin removal/i })
    expect(beginRemoval).toHaveAttribute('aria-disabled', 'true')
    expect(beginRemoval).not.toBeDisabled()
  })

  it('does not call onBeginRemoval while loading', () => {
    render({ ...props, isPressed: true })

    fireEvent.click(screen.getByRole('button', { name: /Begin removal/i }))

    expect(props.onBeginRemoval).not.toHaveBeenCalled()
  })

  it('calls onSkip when skip button is clicked', () => {
    render(props)

    fireEvent.click(screen.getByText('Skip and home pipette'))

    expect(props.onSkip).toHaveBeenCalled()
  })

  it('calls onBeginRemoval when begin removal button is clicked', () => {
    render(props)

    fireEvent.click(screen.getByText('Begin removal'))

    expect(props.onBeginRemoval).toHaveBeenCalled()
  })
})
