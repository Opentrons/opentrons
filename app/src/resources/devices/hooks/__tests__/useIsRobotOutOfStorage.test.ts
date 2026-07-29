import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  useAccessControlEnabledQuery,
  useHealth,
} from '@opentrons/react-api-client'

import { useIsRobotOutOfStorage } from '../useIsRobotOutOfStorage'

vi.mock('@opentrons/react-api-client')

describe('useIsRobotOutOfStorage', () => {
  it('returns false if robot is not in access control mode', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: false } },
    } as any)
    vi.mocked(useHealth).mockReturnValue(undefined)
    const { result } = renderHook(useIsRobotOutOfStorage)
    expect(result.current).toBe(false)
  })

  it('returns false if robot is in access control mode but storage space remains', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: true } },
    } as any)
    vi.mocked(useHealth).mockReturnValue({
      disk_details: { systemTotalMb: 100, systemAvailableMb: 90 },
    } as any)
    const { result } = renderHook(useIsRobotOutOfStorage)
    expect(result.current).toBe(false)
  })

  it('returns true if robot is in access control mode and used space is greater than limit', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: true } },
    } as any)
    vi.mocked(useHealth).mockReturnValue({
      disk_details: { systemTotalMb: 100, systemAvailableMb: 5 },
    } as any)
    const { result } = renderHook(useIsRobotOutOfStorage)
    expect(result.current).toBe(true)
  })

  it('returns true if robot is in access control mode and used space equals limit', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: true } },
    } as any)
    vi.mocked(useHealth).mockReturnValue({
      disk_details: { systemTotalMb: 100, systemAvailableMb: 10 },
    } as any)
    const { result } = renderHook(useIsRobotOutOfStorage)
    expect(result.current).toBe(true)
  })
})
