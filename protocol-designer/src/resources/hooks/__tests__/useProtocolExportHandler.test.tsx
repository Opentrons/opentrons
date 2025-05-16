import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useBlockingHint } from '../../../components/organisms'
import { useProtocolExportHandler } from '../useProtocolExportHandler'

import type { USeProtocolExportHandlerProps } from '../useProtocolExportHandler'

vi.mock('../../../pages/ProtocolOverview/UnusedModalContent')
vi.mock('../../../components/organisms/BlockingHintModal/useBlockingHint')

const mockOnConfirmExport = vi.fn()
const mockModal = <div>mock Modal</div>

describe('useProtocolExportHandler', () => {
  let props: USeProtocolExportHandlerProps

  beforeEach(() => {
    props = {
      noCommands: false,
      modulesWithoutStep: [],
      pipettesWithoutStep: [],
      gripperWithoutStep: false,
      fixtureWithoutStep: {
        trashBin: false,
        wasteChute: false,
        stagingAreaSlots: [],
      },
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
      noCommands: true,
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
