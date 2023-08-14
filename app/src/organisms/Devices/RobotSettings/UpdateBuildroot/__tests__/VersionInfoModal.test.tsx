import * as React from 'react'

import {
  mountWithStore,
  AlertModal,
  OutlineButton,
} from '@opentrons/components'
import { mockReachableRobot } from '../../../../../redux/discovery/__fixtures__'
import {
  UPGRADE,
  DOWNGRADE,
  REINSTALL,
} from '../../../../../redux/robot-update'
import * as Shell from '../../../../../redux/shell'
import { Portal } from '../../../../../App/portal'
import { UpdateAppModal } from '../../../../UpdateAppModal'
import { VersionList } from '../VersionList'
import { SyncRobotMessage } from '../SyncRobotMessage'
import { SkipAppUpdateMessage } from '../SkipAppUpdateMessage'
import { VersionInfoModal } from '../VersionInfoModal'

import type { State, Action } from '../../../../../redux/types'

jest.mock('../../../../../redux/shell/update')
jest.mock('../../../../UpdateAppModal', () => ({
  UpdateAppModal: () => null,
}))

const MOCK_STATE: State = {} as any

const getAvailableShellUpdate = Shell.getAvailableShellUpdate as jest.MockedFunction<
  typeof Shell.getAvailableShellUpdate
>

describe('VersionInfoModal', () => {
  const handleClose = jest.fn()
  const mockGoToViewUpdate = jest.fn()
  const mockInstallUpdate = jest.fn()

  const render = (
    robotUpdateType: React.ComponentProps<
      typeof VersionInfoModal
    >['robotUpdateType'] = UPGRADE
  ) => {
    return mountWithStore<
      React.ComponentProps<typeof VersionInfoModal>,
      State,
      Action
    >(
      <VersionInfoModal
        robot={mockReachableRobot}
        robotUpdateType={robotUpdateType}
        close={handleClose}
        goToViewUpdate={mockGoToViewUpdate}
        installUpdate={mockInstallUpdate}
      />,
      { initialState: MOCK_STATE }
    )
  }

  beforeEach(() => {
    getAvailableShellUpdate.mockImplementation(state => {
      expect(state).toBe(MOCK_STATE)
      return null
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render an AlertModal with the proper children for an upgrade', () => {
    const { wrapper } = render(UPGRADE)
    const alert = wrapper.find(AlertModal)
    const versionList = alert.find(VersionList)
    const syncRobot = alert.find(SyncRobotMessage)
    const closeButton = alert.find(OutlineButton).at(0)
    const primaryButton = alert.find(OutlineButton).at(1)

    expect(alert.prop('heading')).toBe('Robot Update Available')
    expect(versionList.props()).toEqual({
      robotVersion: '0.0.0-mock',
      appVersion: Shell.CURRENT_VERSION,
      availableUpdate: Shell.CURRENT_VERSION,
    })
    expect(syncRobot.props()).toEqual({
      updateType: UPGRADE,
      version: Shell.CURRENT_VERSION,
    })

    expect(closeButton.text()).toMatch(/not now/i)
    expect(primaryButton.text()).toMatch(/view robot update/i)

    expect(handleClose).not.toHaveBeenCalled()
    closeButton.invoke('onClick')?.({} as React.MouseEvent)
    expect(handleClose).toHaveBeenCalled()
    expect(mockInstallUpdate).not.toHaveBeenCalled()
    primaryButton.invoke('onClick')?.({} as React.MouseEvent)
    expect(mockGoToViewUpdate).toHaveBeenCalled()
  })

  it('should render an AlertModal with the proper children for a downgrade', () => {
    const { wrapper } = render(DOWNGRADE)
    const alert = wrapper.find(AlertModal)
    const versionList = alert.find(VersionList)
    const syncRobot = alert.find(SyncRobotMessage)
    const closeButton = alert.find(OutlineButton).at(0)
    const primaryButton = alert.find(OutlineButton).at(1)

    expect(alert.prop('heading')).toBe('Robot Update Available')
    expect(versionList.props()).toEqual({
      robotVersion: '0.0.0-mock',
      appVersion: Shell.CURRENT_VERSION,
      availableUpdate: Shell.CURRENT_VERSION,
    })
    expect(syncRobot.props()).toEqual({
      updateType: DOWNGRADE,
      version: Shell.CURRENT_VERSION,
    })

    expect(closeButton.text()).toMatch(/not now/i)
    expect(primaryButton.text()).toMatch(/downgrade/i)

    expect(handleClose).not.toHaveBeenCalled()
    closeButton.invoke('onClick')?.({} as React.MouseEvent)
    expect(handleClose).toHaveBeenCalled()
    expect(mockInstallUpdate).not.toHaveBeenCalled()
    primaryButton.invoke('onClick')?.({} as React.MouseEvent)
    expect(mockInstallUpdate).toHaveBeenCalled()
  })

  it('should render an AlertModal with the proper children for a reinstall', () => {
    const { wrapper } = render(REINSTALL)
    const alert = wrapper.find(AlertModal)
    const versionList = alert.find(VersionList)
    const syncRobot = alert.find(SyncRobotMessage)
    const closeButton = alert.find(OutlineButton).at(0)
    const primaryButton = alert.find(OutlineButton).at(1)

    expect(alert.prop('heading')).toBe('Robot is up to date')
    expect(versionList.props()).toEqual({
      robotVersion: '0.0.0-mock',
      appVersion: Shell.CURRENT_VERSION,
      availableUpdate: Shell.CURRENT_VERSION,
    })
    expect(syncRobot.exists()).toBe(false)

    expect(closeButton.text()).toMatch(/not now/i)
    expect(primaryButton.text()).toMatch(/reinstall/i)

    expect(handleClose).not.toHaveBeenCalled()
    closeButton.invoke('onClick')?.({} as React.MouseEvent)
    expect(handleClose).toHaveBeenCalled()
    expect(mockInstallUpdate).not.toHaveBeenCalled()
    primaryButton.invoke('onClick')?.({} as React.MouseEvent)
    expect(mockInstallUpdate).toHaveBeenCalled()
  })

  describe('with an app update available', () => {
    beforeEach(() => {
      getAvailableShellUpdate.mockReturnValue('1.2.3')
    })

    it('should render an AlertModal saying an app update is available', () => {
      const { wrapper } = render()
      const alert = wrapper.find(AlertModal)
      const versionList = alert.find(VersionList)

      expect(alert.prop('heading')).toBe('App Version 1.2.3 Available')
      expect(versionList.props()).toEqual({
        robotVersion: '0.0.0-mock',
        appVersion: Shell.CURRENT_VERSION,
        availableUpdate: '1.2.3',
      })
    })

    it('should have a "View Update" button that opens an UpdateAppModal', () => {
      const { wrapper } = render()
      const alert = wrapper.find(AlertModal)
      const viewUpdateButton = alert
        .find('button')
        .filterWhere(b => /view app update/i.test(b.text()))

      expect(wrapper.exists(UpdateAppModal)).toBe(false)

      viewUpdateButton.invoke('onClick')?.({} as React.MouseEvent)

      expect(wrapper.find(Portal).exists(UpdateAppModal)).toBe(true)
    })

    it('should have a SkipAppUpdateMessage that runs the robot update', () => {
      const { wrapper } = render()
      const skipAppUpdate = wrapper.find(SkipAppUpdateMessage)

      expect(mockInstallUpdate).not.toHaveBeenCalled()
      skipAppUpdate.invoke('onClick')?.({} as React.MouseEvent)
      expect(mockInstallUpdate).toHaveBeenCalled()
    })

    it('should call props.close when the UpdateAppModal is closed', () => {
      const { wrapper } = render()
      const alert = wrapper.find(AlertModal)
      const viewUpdateButton = alert
        .find('button')
        .filterWhere(b => /view app update/i.test(b.text()))

      viewUpdateButton.invoke('onClick')?.({} as React.MouseEvent)

      expect(handleClose).not.toHaveBeenCalled()

      wrapper.find(UpdateAppModal).invoke('closeModal')?.()

      expect(handleClose).toHaveBeenCalled()
    })
  })
})
