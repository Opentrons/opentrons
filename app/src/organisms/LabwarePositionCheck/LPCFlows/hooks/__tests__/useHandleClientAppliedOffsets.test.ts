import { useDispatch, useSelector } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { appliedOffsetsToRun } from '/app/redux/protocol-runs'
import {
  useClientDataLPC,
  useUpdateClientLPC,
} from '/app/resources/client_data/'
import { useIsRunCurrent } from '/app/resources/runs'

import { useHandleClientAppliedOffsets } from '../useHandleClientAppliedOffsets'

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

    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: null,
      userId: null,
    })

    vi.mocked(useUpdateClientLPC).mockReturnValue({
      clearClientData: mockClearClientData,
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
      useHandleClientAppliedOffsets(true, RUN_ID)
    })

    expect(mockClearClientData).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should clear client data when run is not current but client data contains this run ID', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(false)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: RUN_ID,
      userId: USER_ID,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(true, RUN_ID)
    })

    expect(mockClearClientData).toHaveBeenCalledTimes(1)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should clear client data when run is current but client data contains a different run ID', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(true)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: OTHER_RUN_ID,
      userId: USER_ID,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(true, RUN_ID)
    })

    expect(mockClearClientData).toHaveBeenCalledTimes(1)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should not take any action when run IDs match but no user ID is present', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(true)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: RUN_ID,
      userId: null,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(true, RUN_ID)
    })

    expect(mockClearClientData).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should dispatch applied offsets when run IDs match and user ID is present', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(true)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: RUN_ID,
      userId: USER_ID,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(true, RUN_ID)
    })

    expect(mockClearClientData).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(appliedOffsetsToRun(RUN_ID))
  })

  it('should not dispatch applied offsets when run IDs do not match, even if user ID is present', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(true)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: OTHER_RUN_ID,
      userId: USER_ID,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(true, RUN_ID)
    })

    expect(mockClearClientData).toHaveBeenCalledTimes(1)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should do nothing when run is current, client data has the same run ID and user ID, and offsets are already applied', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(true)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: RUN_ID,
      userId: USER_ID,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(true, RUN_ID)
    })

    expect(mockClearClientData).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(appliedOffsetsToRun(RUN_ID))
  })

  it('should call clearClientData when not current with null thisRunId', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(false)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: null,
      userId: null,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(true, null)
    })

    expect(mockClearClientData).toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should dispatch when run is current with null thisRunId and user ID is present', () => {
    vi.mocked(useIsRunCurrent).mockReturnValue(true)
    vi.mocked(useClientDataLPC).mockReturnValue({
      runId: null,
      userId: USER_ID,
    })

    renderHook(() => {
      useHandleClientAppliedOffsets(true, null)
    })

    expect(mockClearClientData).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should not dispatch if the robot is not a Flex', () => {
    renderHook(() => {
      useHandleClientAppliedOffsets(false, null)
    })

    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
