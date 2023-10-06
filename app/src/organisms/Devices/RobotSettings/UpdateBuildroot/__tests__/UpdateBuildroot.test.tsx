import React from 'react'
import NiceModal from '@ebay/nice-modal-react'

import { mockConnectableRobot as mockRobot } from '../../../../../redux/discovery/__fixtures__'
import * as RobotUpdate from '../../../../../redux/robot-update'

import { mountWithStore, WrapperWithStore } from '@opentrons/components'
import { handleUpdateBuildroot } from '..'
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
  const render = (): WrapperWithStore<
    React.ComponentProps<typeof NiceModal.Provider>
  > => {
    return mountWithStore<React.ComponentProps<typeof NiceModal.Provider>>(
      <NiceModal.Provider>
        <button
          onClick={() => handleUpdateBuildroot(mockRobot)}
          id="testButton"
        />
      </NiceModal.Provider>,
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
    const { store, wrapper } = render()
    wrapper.find('#testButton').simulate('click')

    expect(store.dispatch).toHaveBeenCalledWith(
      RobotUpdate.setRobotUpdateSeen(mockRobot.name)
    )
  })

  it('renders a ViewUpdateModal if no session exists', () => {
    const { wrapper } = render()
    wrapper.find('#testButton').simulate('click')
    const viewUpdate = wrapper.find(ViewUpdateModal)

    expect(viewUpdate.prop('robotName')).toBe(mockRobot.name)
    expect(viewUpdate.prop('robot')).toBe(mockRobot)
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
    wrapper.find('#testButton').simulate('click')
    const progressModal = wrapper.find(RobotUpdateProgressModal)

    expect(progressModal.prop('robotName')).toBe(mockRobot.name)
  })
})
