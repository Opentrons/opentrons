import { useSelector } from 'react-redux'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LPC_STEP, selectCurrentStep } from '/app/redux/protocol-runs'

import {
  retractPipetteAxesSequentiallyCommands,
  verifyProbeAttachmentAndHomeCommands,
} from '../commands'
import { useHandleProbeCommands } from '../useHandleProbeCommands'

import type { LPCStep } from '/app/redux/protocol-runs'

vi.mock('react-redux')
vi.mock('../commands')
vi.mock('/app/redux/protocol-runs')

describe('useHandleProbeCommands', () => {
  const mockChainLPCCommands = vi.fn()
  const mockRunId = 'mock_run_id'
  let mockCurrentStep: LPCStep = LPC_STEP.ATTACH_PROBE

  const mockProps = {
    chainLPCCommands: mockChainLPCCommands,
    runId: mockRunId,
    maintenanceRunId: 'mock_maintenance_run_id',
  } as any

  const mockPipette = {
    id: 'pipette-123',
    mount: 'left',
    pipetteName: 'mock_pipette_name',
  } as any

  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentStep = LPC_STEP.ATTACH_PROBE

    vi.mocked(useSelector).mockImplementation(selector => {
      if (selector === selectCurrentStep(mockRunId)) {
        return mockCurrentStep
      }
      return null
    })

    vi.mocked(verifyProbeAttachmentAndHomeCommands).mockImplementation(
      pipette => [
        {
          commandType: 'verifyProbeAttachmentAndHome',
          params: { pipetteId: pipette?.id },
        } as any,
      ]
    )

    vi.mocked(retractPipetteAxesSequentiallyCommands).mockImplementation(
      pipette => [
        {
          commandType: 'retractPipetteAxesSequentially',
          params: { pipetteId: pipette?.id },
        } as any,
      ]
    )

    mockChainLPCCommands.mockResolvedValue([])
  })

  it('should return expected functions and initial state', () => {
    const { result } = renderHook(() => useHandleProbeCommands(mockProps))

    expect(result.current).toHaveProperty('handleProbeAttachment')
    expect(result.current).toHaveProperty('handleProbeDetachment')
    expect(result.current).toHaveProperty('unableToDetect', false)
  })

  it('should call chainLPCCommands with correct commands when handleProbeAttachment is called', async () => {
    const { result } = renderHook(() => useHandleProbeCommands(mockProps))

    await act(async () => {
      await result.current.handleProbeAttachment(mockPipette)
    })

    expect(verifyProbeAttachmentAndHomeCommands).toHaveBeenCalledWith(
      mockPipette
    )
    expect(mockChainLPCCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'verifyProbeAttachmentAndHome',
          params: { pipetteId: mockPipette.id },
        },
      ],
      false,
      true
    )
    expect(result.current.unableToDetect).toBe(false)
  })

  it('should set unableToDetect to true when probe attachment verification fails', async () => {
    mockChainLPCCommands.mockRejectedValueOnce(new Error('Verification failed'))

    const { result } = renderHook(() => useHandleProbeCommands(mockProps))

    await act(async () => {
      await expect(
        result.current.handleProbeAttachment(mockPipette)
      ).rejects.toThrow('Unable to detect probe.')
    })

    expect(result.current.unableToDetect).toBe(true)
  })

  it('should call chainLPCCommands with correct commands when handleProbeDetachment is called', async () => {
    const { result } = renderHook(() => useHandleProbeCommands(mockProps))

    await act(async () => {
      await result.current.handleProbeDetachment(mockPipette, mockOnSuccess)
    })

    expect(retractPipetteAxesSequentiallyCommands).toHaveBeenCalledWith(
      mockPipette
    )
    expect(mockChainLPCCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'retractPipetteAxesSequentially',
          params: { pipetteId: mockPipette.id },
        },
      ],
      false
    )
    expect(mockOnSuccess).toHaveBeenCalled()
  })

  it('should reset unableToDetect when step changes from ATTACH_PROBE', async () => {
    mockChainLPCCommands.mockRejectedValueOnce(new Error('Verification failed'))

    const { result, rerender } = renderHook(() =>
      useHandleProbeCommands(mockProps)
    )

    await act(async () => {
      await expect(
        result.current.handleProbeAttachment(mockPipette)
      ).rejects.toThrow('Unable to detect probe.')
    })

    expect(result.current.unableToDetect).toBe(true)

    mockCurrentStep = LPC_STEP.BEFORE_BEGINNING

    act(() => {
      rerender()
    })

    expect(result.current.unableToDetect).toBe(false)
  })

  it('should not reset unableToDetect when staying on ATTACH_PROBE step', async () => {
    mockChainLPCCommands.mockRejectedValueOnce(new Error('Verification failed'))

    const { result, rerender } = renderHook(() =>
      useHandleProbeCommands(mockProps)
    )

    await act(async () => {
      await expect(
        result.current.handleProbeAttachment(mockPipette)
      ).rejects.toThrow('Unable to detect probe.')
    })

    expect(result.current.unableToDetect).toBe(true)

    act(() => {
      rerender()
    })

    expect(result.current.unableToDetect).toBe(true)
  })

  it('should handle null pipette for attachment commands', async () => {
    const { result } = renderHook(() => useHandleProbeCommands(mockProps))

    await act(async () => {
      await result.current.handleProbeAttachment(null)
    })

    expect(verifyProbeAttachmentAndHomeCommands).toHaveBeenCalledWith(null)
    expect(mockChainLPCCommands).toHaveBeenCalled()
  })

  it('should handle null pipette for detachment commands', async () => {
    const { result } = renderHook(() => useHandleProbeCommands(mockProps))

    await act(async () => {
      await result.current.handleProbeDetachment(null, mockOnSuccess)
    })

    expect(retractPipetteAxesSequentiallyCommands).toHaveBeenCalledWith(null)
    expect(mockChainLPCCommands).toHaveBeenCalled()
    expect(mockOnSuccess).toHaveBeenCalled()
  })

  it('should support toggling the unableToDetectProbe status', () => {
    const { result, rerender } = renderHook(() =>
      useHandleProbeCommands(mockProps)
    )

    expect(result.current.unableToDetect).toBe(false)
    result.current.toggleUnableToDetectProbe()

    rerender()

    expect(result.current.unableToDetect).toBe(true)
  })
})
