import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { mountWithStore } from '@opentrons/components'
import * as RobotUpdate from '../../../../../redux/robot-update'

import { DownloadUpdateModal } from '../DownloadUpdateModal'
import { ReleaseNotesModal } from '../ReleaseNotesModal'
import { MigrationWarningModal } from '../MigrationWarningModal'
import { ViewUpdateModal } from '../ViewUpdateModal'

import type { State } from '../../../../../redux/types'

jest.mock('../../../../../redux/robot-update')

const getRobotUpdateInfo = RobotUpdate.getRobotUpdateInfo as jest.MockedFunction<
  typeof RobotUpdate.getRobotUpdateInfo
>
const getRobotUpdateDownloadProgress = RobotUpdate.getRobotUpdateDownloadProgress as jest.MockedFunction<
  typeof RobotUpdate.getRobotUpdateDownloadProgress
>
const getRobotUpdateDownloadError = RobotUpdate.getRobotUpdateDownloadError as jest.MockedFunction<
  typeof RobotUpdate.getRobotUpdateDownloadError
>

const MOCK_STATE: State = { mockState: true } as any
const MOCK_ROBOT_NAME = 'robot-name'
const queryClient = new QueryClient()

describe('ViewUpdateModal', () => {
  const handleClose = jest.fn()
  const handleProceed = jest.fn()

  const render = (
    robotUpdateType: React.ComponentProps<
      typeof ViewUpdateModal
    >['robotUpdateType'] = RobotUpdate.UPGRADE,
    robotSystemType: React.ComponentProps<
      typeof ViewUpdateModal
    >['robotSystemType'] = RobotUpdate.OT2_BUILDROOT
  ) => {
    return mountWithStore<React.ComponentProps<typeof ViewUpdateModal>>(
      <QueryClientProvider client={queryClient}>
        <ViewUpdateModal
          robotName={MOCK_ROBOT_NAME}
          robotUpdateType={robotUpdateType}
          robotSystemType={robotSystemType}
          close={handleClose}
          proceed={handleProceed}
        />
      </QueryClientProvider>,
      { initialState: MOCK_STATE }
    )
  }
  beforeEach(() => {
    getRobotUpdateInfo.mockReturnValue(null)
    getRobotUpdateDownloadProgress.mockReturnValue(50)
    getRobotUpdateDownloadError.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should show a DownloadUpdateModal if the update has not been downloaded yet', () => {
    const { wrapper } = render()
    const downloadUpdateModal = wrapper.find(DownloadUpdateModal)

    expect(downloadUpdateModal.prop('error')).toEqual(null)
    expect(downloadUpdateModal.prop('progress')).toEqual(50)
    expect(getRobotUpdateDownloadProgress).toHaveBeenCalledWith(
      MOCK_STATE,
      'robot-name'
    )

    const closeButtonProps = downloadUpdateModal.prop('notNowButton')

    expect(closeButtonProps.children).toMatch(/not now/i)
    expect(handleClose).not.toHaveBeenCalled()
    closeButtonProps.onClick?.({} as React.MouseEvent)
    expect(handleClose).toHaveBeenCalled()
  })

  it('should show a DownloadUpdateModal if the update download errored out', () => {
    getRobotUpdateDownloadError.mockReturnValue('oh no!')

    const { wrapper } = render()
    const downloadUpdateModal = wrapper.find(DownloadUpdateModal)

    expect(downloadUpdateModal.prop('error')).toEqual('oh no!')
    expect(getRobotUpdateDownloadError).toHaveBeenCalledWith(
      MOCK_STATE,
      'robot-name'
    )

    const closeButtonProps = downloadUpdateModal.prop('notNowButton')

    expect(closeButtonProps.children).toMatch(/close/i)
    expect(handleClose).not.toHaveBeenCalled()
    closeButtonProps.onClick?.({} as React.MouseEvent)
    expect(handleClose).toHaveBeenCalled()
  })

  it('should show a ReleaseNotesModal if the update is an upgrade', () => {
    getRobotUpdateInfo.mockReturnValue({
      version: '1.0.0',
      target: 'ot2',
      releaseNotes: 'hey look a release',
    })

    const { wrapper } = render()
    const releaseNotesModal = wrapper.find(ReleaseNotesModal)

    expect(releaseNotesModal.prop('robotName')).toBe(MOCK_ROBOT_NAME)
    expect(releaseNotesModal.prop('releaseNotes')).toBe('hey look a release')
    expect(releaseNotesModal.prop('systemType')).toBe(RobotUpdate.OT2_BUILDROOT)
    expect(getRobotUpdateInfo).toHaveBeenCalledWith(MOCK_STATE, 'robot-name')

    const closeButtonProps = releaseNotesModal.prop('notNowButton')

    expect(closeButtonProps.children).toMatch(/not now/i)
    expect(handleClose).not.toHaveBeenCalled()
    closeButtonProps.onClick?.({} as React.MouseEvent)
    expect(handleClose).toHaveBeenCalled()

    expect(handleProceed).not.toHaveBeenCalled()
    releaseNotesModal.invoke('proceed')?.()
    expect(handleProceed).toHaveBeenCalled()
  })

  it('should show a MigrationWarningModal if the robot is on Balena', () => {
    const { wrapper } = render(RobotUpdate.UPGRADE, RobotUpdate.OT2_BALENA)
    const migrationWarning = wrapper.find(MigrationWarningModal)

    expect(migrationWarning.prop('updateType')).toBe(RobotUpdate.UPGRADE)

    const closeButtonProps = migrationWarning.prop('notNowButton')

    expect(closeButtonProps.children).toMatch(/not now/i)
    expect(handleClose).not.toHaveBeenCalled()
    closeButtonProps.onClick?.({} as React.MouseEvent)
    expect(handleClose).toHaveBeenCalled()
  })

  it('should proceed from MigrationWarningModal to release notes if upgrade', () => {
    getRobotUpdateInfo.mockReturnValue({
      version: '1.0.0',
      target: 'ot2',
      releaseNotes: 'hey look a release',
    })

    const { wrapper } = render(RobotUpdate.UPGRADE, RobotUpdate.OT2_BALENA)
    const migrationWarning = wrapper.find(MigrationWarningModal)

    migrationWarning.invoke('proceed')?.()

    expect(wrapper.find(ReleaseNotesModal).prop('systemType')).toBe(
      RobotUpdate.OT2_BALENA
    )
  })

  it('should proceed from MigrationWarningModal to DownloadUpdateModal if still downloading', () => {
    const { wrapper } = render(RobotUpdate.UPGRADE, RobotUpdate.OT2_BALENA)
    const migrationWarning = wrapper.find(MigrationWarningModal)

    migrationWarning.invoke('proceed')?.()
    expect(wrapper.exists(DownloadUpdateModal)).toBe(true)
  })
})
