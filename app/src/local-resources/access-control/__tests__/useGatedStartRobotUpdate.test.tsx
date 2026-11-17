import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRequireAdminForUpdates } from '/app/local-resources/access-control/useRequireAdminForUpdates'
import { useRobotUpdateContext } from '/app/resources/robot-update/RobotUpdateContext'

import { useGatedStartRobotUpdate } from '../useGatedStartRobotUpdate'

vi.mock('/app/resources/robot-update/RobotUpdateContext', () => ({
  useRobotUpdateContext: vi.fn(),
}))
vi.mock(
  '/app/local-resources/access-control/useRequireAdminForUpdates',
  () => ({
    useRequireAdminForUpdates: vi.fn(),
  })
)

const ROBOT_NAME = 'otie'
const mockStartUpdate = vi.fn()
const mockEnsureCanUpdate = vi.fn()

describe('useGatedStartRobotUpdate', () => {
  beforeEach(() => {
    mockStartUpdate.mockReset()
    mockEnsureCanUpdate.mockReset()
    vi.mocked(useRobotUpdateContext).mockReturnValue({
      startUpdate: mockStartUpdate,
    })
    vi.mocked(useRequireAdminForUpdates).mockReturnValue({
      isLoading: false,
      ensureCanUpdate: mockEnsureCanUpdate,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('starts the update when the user is allowed', () => {
    mockEnsureCanUpdate.mockReturnValue(true)

    const { result } = renderHook(() => useGatedStartRobotUpdate(ROBOT_NAME))

    expect(result.current.startUpdate('/path/to/system.zip')).toBe(true)
    expect(mockEnsureCanUpdate).toHaveBeenCalled()
    expect(mockStartUpdate).toHaveBeenCalledWith(
      ROBOT_NAME,
      '/path/to/system.zip'
    )
  })

  it('does not start the update when the user is not allowed', () => {
    mockEnsureCanUpdate.mockReturnValue(false)

    const { result } = renderHook(() => useGatedStartRobotUpdate(ROBOT_NAME))

    expect(result.current.startUpdate()).toBe(false)
    expect(mockStartUpdate).not.toHaveBeenCalled()
  })
})
