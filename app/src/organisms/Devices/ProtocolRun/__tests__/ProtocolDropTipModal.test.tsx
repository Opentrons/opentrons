import * as React from 'react'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import { renderHook, act, screen, fireEvent } from '@testing-library/react'

import {
  useProtocolDropTipModal,
  ProtocolDropTipModal,
} from '../ProtocolDropTipModal'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'

describe('useProtocolDropTipModal', () => {
  let props: Parameters<typeof useProtocolDropTipModal>[0]

  beforeEach(() => {
    props = {
      areTipsAttached: true,
      toggleDTWiz: vi.fn(),
      isRunCurrent: true,
    }
  })

  it('should return initial values', () => {
    const { result } = renderHook(() => useProtocolDropTipModal(props))

    expect(result.current).toEqual({
      showDTModal: true,
      onDTModalSkip: expect.any(Function),
      onDTModalRemoval: expect.any(Function),
    })
  })

  it('should update showDTModal when areTipsAttached changes', () => {
    const { result, rerender } = renderHook(() =>
      useProtocolDropTipModal(props)
    )

    expect(result.current.showDTModal).toBe(true)

    props.areTipsAttached = false
    rerender()

    expect(result.current.showDTModal).toBe(false)
  })

  it('should not show modal when isMostRecentRunCurrent is false', () => {
    props.isRunCurrent = false
    const { result } = renderHook(() => useProtocolDropTipModal(props))

    expect(result.current.showDTModal).toBe(false)
  })

  it('should call toggleDTWiz when onDTModalRemoval is called', () => {
    const { result } = renderHook(() => useProtocolDropTipModal(props))

    act(() => {
      result.current.onDTModalRemoval()
    })

    expect(props.toggleDTWiz).toHaveBeenCalled()
  })
})

const render = (props: React.ComponentProps<typeof ProtocolDropTipModal>) => {
  return renderWithProviders(<ProtocolDropTipModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolDropTipModal', () => {
  let props: React.ComponentProps<typeof ProtocolDropTipModal>

  beforeEach(() => {
    props = {
      onSkip: vi.fn(),
      onBeginRemoval: vi.fn(),
      mount: 'left',
    }
  })

  it('renders the modal with correct content', () => {
    render(props)

    screen.getByText('Remove any attached tips')
    screen.queryByText(
      /Homing the .* pipette with liquid in the tips may damage it\. You must remove all tips before using the pipette again\./
    )
    screen.getByText('Begin removal')
    screen.getByText('Skip')
  })

  it('calls onSkip when skip button is clicked', () => {
    render(props)

    fireEvent.click(screen.getByText('Skip'))

    expect(props.onSkip).toHaveBeenCalled()
  })

  it('calls onBeginRemoval when begin removal button is clicked', () => {
    render(props)

    fireEvent.click(screen.getByText('Begin removal'))

    expect(props.onBeginRemoval).toHaveBeenCalled()
  })
})
