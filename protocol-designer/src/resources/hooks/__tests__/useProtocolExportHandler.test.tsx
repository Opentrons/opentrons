import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getProviderWrapperForHooks } from '/protocol-designer/__testing-utils__'
import { getRobotStateTimeline } from '/protocol-designer/file-data/selectors'
import { getArgsAndErrorsByStepId } from '/protocol-designer/step-forms/selectors'

import { useBlockingHint } from '../../../components/organisms'
import { useProtocolExportHandler } from '../useProtocolExportHandler'

import type { UseProtocolExportHandlerProps } from '../useProtocolExportHandler'

vi.mock('../../../components/organisms/BlockingHintModal/useBlockingHint')
vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/file-data/selectors')

const mockOnConfirmExport = vi.fn()
const mockModal = <div>mock Modal</div>

const wrapper = getProviderWrapperForHooks({})

describe('useProtocolExportHandler', () => {
  let props: UseProtocolExportHandlerProps

  beforeEach(() => {
    props = {
      hasCommands: true,
      onConfirmExport: mockOnConfirmExport,
    }
    vi.mocked(getArgsAndErrorsByStepId).mockReturnValue({})
    vi.mocked(getRobotStateTimeline).mockReturnValue({
      timeline: [],
      errors: null,
    })
    vi.mocked(useBlockingHint).mockImplementation(({ enabled }) => {
      return enabled ? mockModal : null
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return null for exportWarningModalElement initially when no warnings', () => {
    const { result } = renderHook(() => useProtocolExportHandler(props), {
      wrapper,
    })
    expect(result.current.exportWarningModalElement).toBe(null)
  })

  it('should return null initially, then the modal element after clicking export when warnings ARE present for no commands', () => {
    props = {
      ...props,
      hasCommands: false,
    }

    const { result } = renderHook(() => useProtocolExportHandler(props), {
      wrapper,
    })
    expect(result.current.exportWarningModalElement).toBe(null)
    act(() => {
      result.current.handleExportClick()
    })
    expect(result.current.exportWarningModalElement).toEqual(mockModal)
    expect(result.current.exportWarningModalElement).not.toBe(null)
  })

  it('should return null initially, then the modal element after clicking export when warnings ARE present for having errors', () => {
    vi.mocked(getRobotStateTimeline).mockReturnValue({
      timeline: {} as any,
      errors: [{ message: 'mock error', type: 'RETRACT_BELOW_DISPENSE' }],
    })
    props = {
      ...props,
      hasCommands: true,
    }
    const { result } = renderHook(() => useProtocolExportHandler(props), {
      wrapper,
    })
    expect(result.current.exportWarningModalElement).toBe(null)
    act(() => {
      result.current.handleExportClick()
    })
    expect(result.current.exportWarningModalElement).toEqual(mockModal)
    expect(result.current.exportWarningModalElement).not.toBe(null)
  })

  it('should call onConfirmExport directly when handleExportClick is called without warnings', () => {
    const { result } = renderHook(() => useProtocolExportHandler(props), {
      wrapper,
    })
    expect(result.current.exportWarningModalElement).toBe(null)
    act(() => {
      result.current.handleExportClick()
    })
    expect(mockOnConfirmExport).toHaveBeenCalled()
    expect(result.current.exportWarningModalElement).toBe(null)
  })
})
