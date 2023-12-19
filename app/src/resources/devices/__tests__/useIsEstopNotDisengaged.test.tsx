import { when, resetAllWhenMocks } from 'jest-when'

import { useIsFlex } from '../../../organisms/Devices/hooks'
import { useEstopQuery } from '@opentrons/react-api-client'
import {
  DISENGAGED,
  NOT_PRESENT,
  PHYSICALLY_ENGAGED,
  LOGICALLY_ENGAGED,
} from '../../../organisms/EmergencyStop'
import { useIsEstopNotDisengaged } from '../hooks/useIsEstopNotDisengaged'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../organisms/Devices/hooks')

const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>
const mockUseEstopQuery = useEstopQuery as jest.MockedFunction<
  typeof useEstopQuery
>

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
    when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(true)
    mockUseEstopQuery.mockReturnValue({
      data: mockEstopStatus,
      error: null,
    } as any)
  })

  afterAll(() => {
    resetAllWhenMocks()
    jest.clearAllMocks()
  })

  it('should return false when e-stop status is disengaged', () => {
    const isEstopNotDisengaged = useIsEstopNotDisengaged(ROBOT_NAME)
    expect(isEstopNotDisengaged).toBe(false)
  })

  it('should return true when e-stop status is physically engaged', () => {
    mockUseEstopQuery.mockReturnValue({
      data: mockPhysicallyEngagedStatus,
    } as any)
    const isEstopNotDisengaged = useIsEstopNotDisengaged(ROBOT_NAME)
    expect(isEstopNotDisengaged).toBe(true)
  })

  it('should return true when e-stop status is logically engaged', () => {
    mockUseEstopQuery.mockReturnValue({
      data: mockLogicallyEngagedStatus,
    } as any)
    const isEstopNotDisengaged = useIsEstopNotDisengaged(ROBOT_NAME)
    expect(isEstopNotDisengaged).toBe(true)
  })
  it('should return true when e-stop status is not present', () => {
    mockUseEstopQuery.mockReturnValue({ data: mockNotPresentStatus } as any)
    const isEstopNotDisengaged = useIsEstopNotDisengaged(ROBOT_NAME)
    expect(isEstopNotDisengaged).toBe(true)
  })
  it('should return false when a robot is OT-2', () => {
    when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(false)
    mockUseEstopQuery.mockReturnValue({
      data: mockPhysicallyEngagedStatus,
    } as any)
    const isEstopNotDisengaged = useIsEstopNotDisengaged(ROBOT_NAME)
    expect(isEstopNotDisengaged).toBe(false)
  })
})
