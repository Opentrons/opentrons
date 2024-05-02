import { when } from 'vitest-when'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useIsFlex } from '../../../organisms/Devices/hooks'
import { useEstopQuery } from '@opentrons/react-api-client'
import {
  DISENGAGED,
  NOT_PRESENT,
  PHYSICALLY_ENGAGED,
  LOGICALLY_ENGAGED,
} from '../../../organisms/EmergencyStop'
import { useIsEstopNotDisengaged } from '../hooks/useIsEstopNotDisengaged'

vi.mock('@opentrons/react-api-client')
vi.mock('../../../organisms/Devices/hooks')

const ROBOT_NAME = 'mockRobot'
const mockEstopStatus = {
  data: {
    status: DISENGAGED,
    leftEstopPhysicalStatus: DISENGAGED,
    rightEstopPhysicalStatus: NOT_PRESENT,
  },
}
const mockPhysicallyEngagedStatus = {
  data: {
    ...mockEstopStatus.data,
    status: PHYSICALLY_ENGAGED,
  },
}
const mockLogicallyEngagedStatus = {
  data: {
    ...mockEstopStatus.data,
    status: LOGICALLY_ENGAGED,
  },
}
const mockNotPresentStatus = {
  data: {
    ...mockEstopStatus.data,
    status: NOT_PRESENT,
  },
}

describe('useIsEstopNotDisengaged', () => {
  beforeEach(() => {
    when(useIsFlex).calledWith(ROBOT_NAME).thenReturn(true)
    vi.mocked(useEstopQuery).mockReturnValue({
      data: mockEstopStatus,
      error: null,
    } as any)
  })

  it('should return false when e-stop status is disengaged', () => {
    const isEstopNotDisengaged = useIsEstopNotDisengaged(ROBOT_NAME)
    expect(isEstopNotDisengaged).toBe(false)
  })

  it('should return true when e-stop status is physically engaged', () => {
    vi.mocked(useEstopQuery).mockReturnValue({
      data: mockPhysicallyEngagedStatus,
    } as any)
    const isEstopNotDisengaged = useIsEstopNotDisengaged(ROBOT_NAME)
    expect(isEstopNotDisengaged).toBe(true)
  })

  it('should return true when e-stop status is logically engaged', () => {
    vi.mocked(useEstopQuery).mockReturnValue({
      data: mockLogicallyEngagedStatus,
    } as any)
    const isEstopNotDisengaged = useIsEstopNotDisengaged(ROBOT_NAME)
    expect(isEstopNotDisengaged).toBe(true)
  })
  it('should return true when e-stop status is not present', () => {
    vi.mocked(useEstopQuery).mockReturnValue({
      data: mockNotPresentStatus,
    } as any)
    const isEstopNotDisengaged = useIsEstopNotDisengaged(ROBOT_NAME)
    expect(isEstopNotDisengaged).toBe(true)
  })
  it('should return false when a robot is OT-2', () => {
    when(useIsFlex).calledWith(ROBOT_NAME).thenReturn(false)
    vi.mocked(useEstopQuery).mockReturnValue({
      data: mockPhysicallyEngagedStatus,
    } as any)
    const isEstopNotDisengaged = useIsEstopNotDisengaged(ROBOT_NAME)
    expect(isEstopNotDisengaged).toBe(false)
  })
})
