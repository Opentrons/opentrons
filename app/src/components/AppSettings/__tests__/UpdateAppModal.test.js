// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import { BaseModal, Flex, Icon } from '@opentrons/components'
import * as Shell from '../../../shell'
import { ErrorModal } from '../../modals'
import { ReleaseNotes } from '../../ReleaseNotes'
import { UpdateAppModal } from '../UpdateAppModal'

import type { State } from '../../../types'
import type { ShellUpdateState, UpdateInfo } from '../../../shell/types'

// TODO(mc, 2020-10-06): this is a partial mock because the shell/update
// needs some reorg to split actions and selectors
jest.mock('../../../shell/update', () => ({
  ...jest.requireActual('../../../shell/update'),
  getShellUpdateState: jest.fn(),
}))

const getShellUpdateState: JestMockFn<[State], $Shape<ShellUpdateState>> =
  Shell.getShellUpdateState

const MOCK_STATE: State = ({ mockState: true }: any)

describe('UpdateAppModal', () => {
  const handleClose = jest.fn()

  const render = () => {
    return mountWithStore(<UpdateAppModal closeModal={handleClose} />, {
      initialState: MOCK_STATE,
    })
  }

  beforeEach(() => {
    getShellUpdateState.mockImplementation(state => {
      expect(state).toBe(MOCK_STATE)
      return {
        info: ({
          version: '1.2.3',
          releaseNotes: 'this is a release',
        }: $Shape<UpdateInfo>),
      }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render an BaseModal using available version from state', () => {
    const { wrapper } = render()
    const modal = wrapper.find(BaseModal)
    const title = modal.find('h2')
    const titleIcon = title.closest(Flex).find(Icon)

    expect(title.text()).toBe('App Version 1.2.3 Available')
    expect(titleIcon.prop('name')).toBe('alert')
  })

  it('should render a <ReleaseNotes> component with the release notes', () => {
    const { wrapper } = render()
    const releaseNotes = wrapper.find(ReleaseNotes)

    expect(releaseNotes.prop('source')).toBe('this is a release')
  })

  it('should render a "Not Now" button that closes the modal', () => {
    const { wrapper } = render()
    const notNowButton = wrapper
      .find('button')
      .filterWhere(b => /not now/i.test(b.text()))

    expect(handleClose).not.toHaveBeenCalled()
    notNowButton.invoke('onClick')()
    expect(handleClose).toHaveBeenCalled()
  })

  it('should render a "Download" button that starts the update', () => {
    const { wrapper, store } = render()
    const downloadButton = wrapper
      .find('button')
      .filterWhere(b => /download/i.test(b.text()))

    downloadButton.invoke('onClick')()

    expect(store.dispatch).toHaveBeenCalledWith(Shell.downloadShellUpdate())
  })

  it('should render a spinner if update is downloading', () => {
    getShellUpdateState.mockReturnValue({ downloading: true })
    const { wrapper } = render()
    const spinner = wrapper
      .find(Icon)
      .filterWhere(i => i.prop('name') === 'ot-spinner')
    const spinnerParent = spinner.closest(Flex)

    expect(spinnerParent.text()).toMatch(/download in progress/i)
  })

  it('should render a instructional copy instead of release notes if update is downloaded', () => {
    getShellUpdateState.mockReturnValue({
      downloaded: true,
      info: ({
        version: '1.2.3',
        releaseNotes: 'this is a release',
      }: $Shape<UpdateInfo>),
    })

    const { wrapper } = render()
    const title = wrapper.find('h2')

    expect(title.text()).toBe('App Version 1.2.3 Downloaded')
    expect(wrapper.exists(ReleaseNotes)).toBe(false)
    expect(wrapper.text()).toMatch(/Restart your app to complete the update/i)
  })

  it('should render a "Restart App" button if update is downloaded', () => {
    getShellUpdateState.mockReturnValue({ downloaded: true })
    const { wrapper, store } = render()
    const restartButton = wrapper
      .find('button')
      .filterWhere(b => /restart/i.test(b.text()))

    restartButton.invoke('onClick')()
    expect(store.dispatch).toHaveBeenCalledWith(Shell.applyShellUpdate())
  })

  it('should render a "Not Now" button if update is downloaded', () => {
    getShellUpdateState.mockReturnValue({ downloaded: true })
    const { wrapper } = render()
    const notNowButton = wrapper
      .find('button')
      .filterWhere(b => /not now/i.test(b.text()))

    notNowButton.invoke('onClick')()
    expect(handleClose).toHaveBeenCalled()
  })

  it('should render an ErrorModal if the update errors', () => {
    getShellUpdateState.mockReturnValue({
      error: {
        message: 'Could not get code signature for running application',
        name: 'Error',
      },
    })

    const { wrapper } = render()
    const errorModal = wrapper.find(ErrorModal)

    expect(errorModal.prop('heading')).toBe('Update Error')
    expect(errorModal.prop('description')).toBe(
      'Something went wrong while updating your app'
    )
    expect(errorModal.prop('error')).toEqual({
      message: 'Could not get code signature for running application',
      name: 'Error',
    })

    errorModal.invoke('close')()

    expect(handleClose).toHaveBeenCalled()
  })
})
