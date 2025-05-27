import { useDispatch } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { updateLPCLabware } from '/app/redux/protocol-runs'

import { useUpdateLabware } from '../useUpdateLabware'

import type { LPCLabwareInfo } from '/app/redux/protocol-runs'

vi.mock('react-redux')
vi.mock('/app/redux/protocol-runs')

describe('useUpdateLabware', () => {
  const RUN_ID = 'run-123'
  const MAINTENANCE_RUN_ID = 'maintenance-456'
  const MOCK_LABWARE_INFO = { areOffsetsApplied: true } as LPCLabwareInfo
  const mockDispatch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(updateLPCLabware).mockImplementation(
      (runId: string, labwareInfo: LPCLabwareInfo['labware']) =>
        ({ type: 'UPDATE_LPC_LABWARE', runId, labwareInfo } as any)
    )
  })

  it('should dispatch updateLPCLabware when runId is provided and maintenanceRunId is null', () => {
    renderHook(() => useUpdateLabware(true, RUN_ID, null, MOCK_LABWARE_INFO))

    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(updateLPCLabware).toHaveBeenCalledWith(
      RUN_ID,
      MOCK_LABWARE_INFO.labware
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      updateLPCLabware(RUN_ID, MOCK_LABWARE_INFO.labware)
    )
  })

  it('should not dispatch when runId is null', () => {
    renderHook(() => useUpdateLabware(true, null, null, MOCK_LABWARE_INFO))

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(updateLPCLabware).not.toHaveBeenCalled()
  })

  it('should not dispatch when maintenanceRunId is provided', () => {
    renderHook(() =>
      useUpdateLabware(true, RUN_ID, MAINTENANCE_RUN_ID, MOCK_LABWARE_INFO)
    )

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(updateLPCLabware).not.toHaveBeenCalled()
  })

  it('should re-dispatch when labwareInfo changes', () => {
    const { rerender } = renderHook(
      props =>
        useUpdateLabware(
          props.isFlex,
          props.runId,
          props.maintenanceRunId,
          props.labwareInfo
        ),
      {
        initialProps: {
          isFlex: true,
          runId: RUN_ID,
          maintenanceRunId: null,
          labwareInfo: MOCK_LABWARE_INFO,
        },
      }
    )

    expect(mockDispatch).toHaveBeenCalledTimes(1)
    mockDispatch.mockClear()

    const NEW_LABWARE_INFO = { areOffsetsApplied: false } as LPCLabwareInfo
    rerender({
      isFlex: true,
      runId: RUN_ID,
      maintenanceRunId: null,
      labwareInfo: NEW_LABWARE_INFO,
    })

    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(updateLPCLabware).toHaveBeenCalledWith(
      RUN_ID,
      NEW_LABWARE_INFO.labware
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      updateLPCLabware(RUN_ID, NEW_LABWARE_INFO.labware)
    )
  })

  it('should re-dispatch when maintenanceRunId changes from value to null', () => {
    const { rerender } = renderHook(
      props => {
        useUpdateLabware(
          props.isFlex,
          props.runId,
          props.maintenanceRunId,
          props.labwareInfo
        )
      },
      {
        initialProps: {
          isFlex: true,
          runId: RUN_ID,
          maintenanceRunId: MAINTENANCE_RUN_ID,
          labwareInfo: MOCK_LABWARE_INFO,
        },
      }
    )

    expect(mockDispatch).not.toHaveBeenCalled()

    rerender({
      isFlex: true,
      runId: RUN_ID,
      maintenanceRunId: null,
      labwareInfo: MOCK_LABWARE_INFO,
    } as any)

    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(updateLPCLabware).toHaveBeenCalledWith(
      RUN_ID,
      MOCK_LABWARE_INFO.labware
    )
  })

  it('should not re-dispatch when runId changes but other params remain the same', () => {
    const { rerender } = renderHook(
      props => {
        useUpdateLabware(
          props.isFlex,
          props.runId,
          props.maintenanceRunId,
          props.labwareInfo
        )
      },
      {
        initialProps: {
          isFlex: true,
          runId: RUN_ID,
          maintenanceRunId: null,
          labwareInfo: MOCK_LABWARE_INFO,
        },
      }
    )

    expect(mockDispatch).toHaveBeenCalledTimes(1)
    mockDispatch.mockClear()

    const NEW_RUN_ID = 'run-456'
    rerender({
      isFlex: true,
      runId: NEW_RUN_ID,
      maintenanceRunId: null,
      labwareInfo: MOCK_LABWARE_INFO,
    })

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should not dispatch if the robot is not a flex', () => {
    renderHook(() =>
      useUpdateLabware(false, RUN_ID, MAINTENANCE_RUN_ID, MOCK_LABWARE_INFO)
    )

    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
