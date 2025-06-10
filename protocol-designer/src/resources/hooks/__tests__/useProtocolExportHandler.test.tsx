import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useBlockingHint } from '../../../components/organisms'
import { useProtocolExportHandler } from '../useProtocolExportHandler'

import type { UseProtocolExportHandlerProps } from '../useProtocolExportHandler'

vi.mock('../../../components/organisms/BlockingHintModal/useBlockingHint')

const mockOnConfirmExport = vi.fn()
const mockModal = <div>mock Modal</div>

describe('useProtocolExportHandler', () => {
  let props: UseProtocolExportHandlerProps

  beforeEach(() => {
    props = {
      hasCommands: true,
      onConfirmExport: mockOnConfirmExport,
    }

    vi.mocked(useBlockingHint).mockImplementation(({ enabled }) => {
      return enabled ? mockModal : null
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return null for exportWarningModalElement initially when no warnings', () => {
    const { result } = renderHook(() => useProtocolExportHandler(props))
    expect(result.current.exportWarningModalElement).toBe(null)
  })

  it('should return null initially, then the modal element after clicking export when warnings ARE present', () => {
    props = {
      ...props,
      hasCommands: false,
    }

    const { result } = renderHook(() => useProtocolExportHandler(props))
    expect(result.current.exportWarningModalElement).toBe(null)
    act(() => {
      result.current.handleExportClick()
    })
    expect(result.current.exportWarningModalElement).toEqual(mockModal)
    expect(result.current.exportWarningModalElement).not.toBe(null)
  })

  it('should call onConfirmExport directly when handleExportClick is called without warnings', () => {
    const { result } = renderHook(() => useProtocolExportHandler(props))
    expect(result.current.exportWarningModalElement).toBe(null)
    act(() => {
      result.current.handleExportClick()
    })
    expect(mockOnConfirmExport).toHaveBeenCalled()
    expect(result.current.exportWarningModalElement).toBe(null)
  })
})
