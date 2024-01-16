import { useDispatch } from 'react-redux'
import { renderHook } from '@testing-library/react'

import { useDispatchStartRobotUpdate } from '../hooks'
import { startRobotUpdate, clearRobotUpdateSession } from '../actions'

jest.mock('react-redux')

const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>

describe('useDispatchStartRobotUpdate', () => {
  let mockDispatch: jest.Mock
  const mockRobotName = 'robotName'
  const mockSystemFile = 'systemFile'

  beforeEach(() => {
    mockDispatch = jest.fn()
    mockUseDispatch.mockReturnValue(mockDispatch)
  })

  afterEach(() => {
    mockUseDispatch.mockClear()
    jest.clearAllMocks()
  })

  it('clears the robot update session before dispatching a new session with the given robotName and systemFile', () => {
    const { result } = renderHook(useDispatchStartRobotUpdate)

    result.current(mockRobotName, mockSystemFile)
    expect(mockDispatch).toHaveBeenCalledWith(clearRobotUpdateSession())
    expect(mockDispatch).toHaveBeenCalledWith(
      startRobotUpdate(mockRobotName, mockSystemFile)
    )
  })
})
