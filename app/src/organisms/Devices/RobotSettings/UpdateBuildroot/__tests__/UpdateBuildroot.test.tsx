import React from 'react'

import { mockConnectableRobot as mockRobot } from '../../../../../redux/discovery/__fixtures__'
import * as RobotUpdate from '../../../../../redux/robot-update'

import { mountWithStore, WrapperWithStore } from '@opentrons/components'
import { UpdateBuildroot } from '..'
import { ViewUpdateModal } from '../ViewUpdateModal'
import { RobotUpdateProgressModal } from '../RobotUpdateProgressModal'

import type { State } from '../../../../../redux/types'

jest.mock('../ViewUpdateModal', () => ({
  ViewUpdateModal: () => <></>,
}))

jest.mock('../RobotUpdateProgressModal', () => ({
  RobotUpdateProgressModal: () => <></>,
}))

jest.mock('../../../../../redux/robot-update/selectors')

const getRobotUpdateAvailable = RobotUpdate.getRobotUpdateAvailable as jest.MockedFunction<
  typeof RobotUpdate.getRobotUpdateAvailable
>
const getRobotUpdateSession = RobotUpdate.getRobotUpdateSession as jest.MockedFunction<
  typeof RobotUpdate.getRobotUpdateSession
>
const getRobotSystemType = RobotUpdate.getRobotSystemType as jest.MockedFunction<
  typeof RobotUpdate.getRobotSystemType
>

const MOCK_STATE: State = { mockState: true } as any

describe('UpdateBuildroot', () => {
  const closeModal = jest.fn()
  const render = (): WrapperWithStore<
    React.ComponentProps<typeof UpdateBuildroot>
  > => {
    return mountWithStore<React.ComponentProps<typeof UpdateBuildroot>>(
      <UpdateBuildroot robot={mockRobot} close={closeModal} />,
      { initialState: MOCK_STATE }
    )
  }

  beforeEach(() => {
    getRobotUpdateAvailable.mockReturnValue(RobotUpdate.UPGRADE)
    getRobotSystemType.mockReturnValue(RobotUpdate.OT2_BUILDROOT)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should set the update as seen on mount', () => {
    const { store } = render()

    expect(store.dispatch).toHaveBeenCalledWith(
      RobotUpdate.setRobotUpdateSeen(mockRobot.name)
    )
  })

  it('renders a ViewUpdateModal if no session exists', () => {
    const { wrapper } = render()
    const viewUpdate = wrapper.find(ViewUpdateModal)

    expect(viewUpdate.prop('robotName')).toBe(mockRobot.name)
    expect(viewUpdate.prop('robotUpdateType')).toBe(RobotUpdate.UPGRADE)

    expect(getRobotUpdateAvailable).toHaveBeenCalledWith(MOCK_STATE, mockRobot)
    expect(closeModal).not.toHaveBeenCalled()

    viewUpdate.invoke('closeModal')?.()
    expect(closeModal).toHaveBeenCalled()
  })

  it('renders RobotUpdateProgressModal if session exists', () => {
    const mockSession = {
      robotName: mockRobot.name,
      fileInfo: null,
      token: null,
      pathPrefix: null,
      step: null,
      stage: null,
      progress: 50,
      error: null,
    }
    getRobotUpdateSession.mockReturnValue(mockSession)

    const { wrapper } = render()
    const progressModal = wrapper.find(RobotUpdateProgressModal)

    expect(progressModal.prop('robotName')).toBe(mockRobot.name)
    expect(progressModal.prop('updateStep')).toBe('download')
    expect(progressModal.prop('error')).toBe(mockSession.error)
    expect(progressModal.prop('stepProgress')).toBe(mockSession.progress)
  })
})
