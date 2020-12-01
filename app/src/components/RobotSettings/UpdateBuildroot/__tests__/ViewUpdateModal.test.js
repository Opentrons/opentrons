// @flow
import * as React from 'react'

import { mountWithStore } from '@opentrons/components/__utils__'
import * as Buildroot from '../../../../buildroot'

import { DownloadUpdateModal } from '../DownloadUpdateModal'
import { ReleaseNotesModal } from '../ReleaseNotesModal'
import { MigrationWarningModal } from '../MigrationWarningModal'
import { ViewUpdateModal } from '../ViewUpdateModal'

import type { State } from '../../../../types'

jest.mock('../../../../buildroot')

const getBuildrootUpdateInfo: JestMockFn<
  [State],
  $Call<typeof Buildroot.getBuildrootUpdateInfo, State>
> = Buildroot.getBuildrootUpdateInfo

const getBuildrootDownloadProgress: JestMockFn<
  [State],
  $Call<typeof Buildroot.getBuildrootDownloadProgress, State>
> = Buildroot.getBuildrootDownloadProgress

const getBuildrootDownloadError: JestMockFn<
  [State],
  $Call<typeof Buildroot.getBuildrootDownloadError, State>
> = Buildroot.getBuildrootDownloadError

const MOCK_STATE: State = ({ mockState: true }: any)
const MOCK_ROBOT_NAME = 'robot-name'

describe('ViewUpdateModal', () => {
  const handleClose = jest.fn()
  const handleProceed = jest.fn()

  const render = (
    robotUpdateType = Buildroot.UPGRADE,
    robotSystemType = Buildroot.BUILDROOT
  ) => {
    return mountWithStore(
      <ViewUpdateModal
        robotName={MOCK_ROBOT_NAME}
        robotUpdateType={robotUpdateType}
        robotSystemType={robotSystemType}
        close={handleClose}
        proceed={handleProceed}
      />,
      { initialState: MOCK_STATE }
    )
  }

  beforeEach(() => {
    getBuildrootUpdateInfo.mockReturnValue(null)
    getBuildrootDownloadProgress.mockReturnValue(50)
    getBuildrootDownloadError.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should show a DownloadUpdateModal if the update has not been downloaded yet', () => {
    const { wrapper } = render()
    const downloadUpdateModal = wrapper.find(DownloadUpdateModal)

    expect(downloadUpdateModal.prop('error')).toEqual(null)
    expect(downloadUpdateModal.prop('progress')).toEqual(50)
    expect(getBuildrootDownloadProgress).toHaveBeenCalledWith(MOCK_STATE)

    const closeButtonProps = downloadUpdateModal.prop('notNowButton')

    expect(closeButtonProps.children).toMatch(/not now/i)
    expect(handleClose).not.toHaveBeenCalled()
    closeButtonProps.onClick()
    expect(handleClose).toHaveBeenCalled()
  })

  it('should show a DownloadUpdateModal if the update download errored out', () => {
    getBuildrootDownloadError.mockReturnValue('oh no!')

    const { wrapper } = render()
    const downloadUpdateModal = wrapper.find(DownloadUpdateModal)

    expect(downloadUpdateModal.prop('error')).toEqual('oh no!')
    expect(getBuildrootDownloadError).toHaveBeenCalledWith(MOCK_STATE)

    const closeButtonProps = downloadUpdateModal.prop('notNowButton')

    expect(closeButtonProps.children).toMatch(/close/i)
    expect(handleClose).not.toHaveBeenCalled()
    closeButtonProps.onClick()
    expect(handleClose).toHaveBeenCalled()
  })

  it('should show a ReleaseNotesModal if the update is an upgrade', () => {
    getBuildrootUpdateInfo.mockReturnValue({
      releaseNotes: 'hey look a release',
    })

    const { wrapper } = render()
    const releaseNotesModal = wrapper.find(ReleaseNotesModal)

    expect(releaseNotesModal.prop('robotName')).toBe(MOCK_ROBOT_NAME)
    expect(releaseNotesModal.prop('releaseNotes')).toBe('hey look a release')
    expect(releaseNotesModal.prop('systemType')).toBe(Buildroot.BUILDROOT)
    expect(getBuildrootUpdateInfo).toHaveBeenCalledWith(MOCK_STATE)

    const closeButtonProps = releaseNotesModal.prop('notNowButton')

    expect(closeButtonProps.children).toMatch(/not now/i)
    expect(handleClose).not.toHaveBeenCalled()
    closeButtonProps.onClick()
    expect(handleClose).toHaveBeenCalled()

    expect(handleProceed).not.toHaveBeenCalled()
    releaseNotesModal.invoke('proceed')()
    expect(handleProceed).toHaveBeenCalled()
  })

  it('should proceed straight to update if downgrade', () => {
    getBuildrootUpdateInfo.mockReturnValue({
      releaseNotes: 'hey look a release',
    })

    render(Buildroot.DOWNGRADE)
    expect(handleProceed).toHaveBeenCalled()
  })

  it('should proceed straight to update if reinstall', () => {
    getBuildrootUpdateInfo.mockReturnValue({
      releaseNotes: 'hey look a release',
    })

    render(Buildroot.REINSTALL)
    expect(handleProceed).toHaveBeenCalled()
  })

  it('should show a MigrationWarningModal if the robot is on Balena', () => {
    const { wrapper } = render(Buildroot.UPGRADE, Buildroot.BALENA)
    const migrationWarning = wrapper.find(MigrationWarningModal)

    expect(migrationWarning.prop('updateType')).toBe(Buildroot.UPGRADE)

    const closeButtonProps = migrationWarning.prop('notNowButton')

    expect(closeButtonProps.children).toMatch(/not now/i)
    expect(handleClose).not.toHaveBeenCalled()
    closeButtonProps.onClick()
    expect(handleClose).toHaveBeenCalled()
  })

  it('should proceed from MigrationWarningModal to release notes if upgrade', () => {
    getBuildrootUpdateInfo.mockReturnValue({
      releaseNotes: 'hey look a release',
    })

    const { wrapper } = render(Buildroot.UPGRADE, Buildroot.BALENA)
    const migrationWarning = wrapper.find(MigrationWarningModal)

    migrationWarning.invoke('proceed')()

    expect(wrapper.find(ReleaseNotesModal).prop('systemType')).toBe(
      Buildroot.BALENA
    )
  })

  it('should proceed from MigrationWarningModal to DownloadUpdateModal if still downloading', () => {
    const { wrapper } = render(Buildroot.UPGRADE, Buildroot.BALENA)
    const migrationWarning = wrapper.find(MigrationWarningModal)

    migrationWarning.invoke('proceed')()
    expect(wrapper.exists(DownloadUpdateModal)).toBe(true)
  })
})
