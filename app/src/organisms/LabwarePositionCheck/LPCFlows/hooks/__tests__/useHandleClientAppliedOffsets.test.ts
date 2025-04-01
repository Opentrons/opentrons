import { vi, it, describe, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHandleClientAppliedOffsets } from '../useHandleClientAppliedOffsets'
import { useDispatch, useSelector } from 'react-redux'
import {
  useClientDataLPC,
  useUpdateClientLPC,
} from '/app/resources/client_data/'
import {
  appliedOffsetsToRun,
  selectAreOffsetsApplied,
} from '/app/redux/protocol-runs'
import { useIsRunCurrent } from '/app/resources/runs'

vi.mock('react-redux')
vi.mock('/app/resources/client_data/')
vi.mock('/app/redux/protocol-runs')
vi.mock('/app/resources/runs')

describe('useHandleClientAppliedOffsets', () => {
  const RUN_ID = 'run-123'
  const OTHER_RUN_ID = 'other-run-456'
  const USER_ID = 'user-789'

  const mockDispatch = vi.fn()
  const mockClearClientData = vi.fn()
  const mockUpdateWithRunId = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useDispatch).mockReturnValue(mockDispatch)

    vi.mocked(appliedOffsetsToRun).mockImplementation(
      (runId: string) =>
        ({ type: 'APPLIED_OFFSETS_TO_RUN', payload: runId } as any)
    )

    vi.mocked(useIsRunCurrent).mockImplementation(
      (runId: string | null) => false
    )

    vi.mocked(
      selectAreOffsetsApplied
    ).mockImplementation((runId: string) => (state: any) => false)

    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: null,
      userId: null,
    })

    vi.mocked(useUpdateClientLPC).mockReturnValue({
      clearClientData: mockClearClientData,
      updateWithRunId: mockUpdateWithRunId,
    } as any)

    vi.mocked(useSelector).mockImplementation(selector => {
      if (typeof selector === 'function') {
        return selector({})
      }
      return null
    })
  })

  it('should not update client data when run is not current', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(false)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: null,
      userId: null,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(RUN_ID)
    })

    expect(mockClearClientData).not.toHaveBeenCalled()
    expect(mockUpdateWithRunId).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should clear client data when run is not current but client data contains this run ID', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(false)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: RUN_ID,
      userId: USER_ID,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(RUN_ID)
    })

    expect(mockClearClientData).toHaveBeenCalledTimes(1)
    expect(mockUpdateWithRunId).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should clear client data when run is current but client data contains a different run ID', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(true)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: OTHER_RUN_ID,
      userId: USER_ID,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(RUN_ID)
    })

    expect(mockClearClientData).toHaveBeenCalledTimes(1)
    expect(mockUpdateWithRunId).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should update client data when offsets are applied locally but not by another user', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(true)
    vi.mocked(
      selectAreOffsetsApplied
    ).mockImplementation((runId: string) => (state: any) => true)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: RUN_ID,
      userId: null,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(RUN_ID)
    })

    expect(mockClearClientData).not.toHaveBeenCalled()
    expect(mockUpdateWithRunId).toHaveBeenCalledWith(RUN_ID)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should dispatch applied offsets when offsets are applied by another user but not locally', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(true)
    vi.mocked(
      selectAreOffsetsApplied
    ).mockImplementation((runId: string) => (state: any) => false)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: RUN_ID,
      userId: USER_ID,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(RUN_ID)
    })

    expect(mockClearClientData).not.toHaveBeenCalled()
    expect(mockUpdateWithRunId).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(appliedOffsetsToRun(RUN_ID))
  })

  it('should do nothing when run is current, client data has the same run ID, and offsets are already applied', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(true)
    vi.mocked(
      selectAreOffsetsApplied
    ).mockImplementation((runId: string) => (state: any) => true)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: RUN_ID,
      userId: USER_ID,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(RUN_ID)
    })

    expect(mockClearClientData).not.toHaveBeenCalled()
    expect(mockUpdateWithRunId).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should call clearClientData with null thisRunId when not current', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(false)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: null,
      userId: null,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(null)
    })

    expect(mockClearClientData).toHaveBeenCalledTimes(1)
    expect(mockUpdateWithRunId).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should call updateWithRunId with null thisRunId when current and offsets applied', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(true)
    vi.mocked(
      selectAreOffsetsApplied
    ).mockImplementation((runId: string) => (state: any) => true)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: null,
      userId: null,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(null)
    })

    expect(mockClearClientData).not.toHaveBeenCalled()
    expect(mockUpdateWithRunId).toHaveBeenCalledWith(null)
    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
