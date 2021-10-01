import * as React from 'react'
import { Link as InternalLink } from 'react-router-dom'
import { mountWithStore } from '@opentrons/components'

import { BaseModal, Flex, Icon } from '@opentrons/components'
import * as Shell from '../../../redux/shell'
import { ErrorModal } from '../../../molecules/modals'
import { ReleaseNotes } from '../../../molecules/ReleaseNotes'
import { UpdateAppModal } from '..'

import type { State, Action } from '../../../redux/types'
import type { ShellUpdateState } from '../../../redux/shell/types'
import type { UpdateAppModalProps } from '..'
import type { HTMLAttributes, ReactWrapper } from 'enzyme'

// TODO(mc, 2020-10-06): this is a partial mock because shell/update
// needs some reorg to split actions and selectors
jest.mock('../../../redux/shell/update', () => ({
  ...jest.requireActual<{}>('../../../redux/shell/update'),
  getShellUpdateState: jest.fn(),
}))

jest.mock('react-router-dom', () => ({ Link: () => <></> }))

const getShellUpdateState = Shell.getShellUpdateState as jest.MockedFunction<
  typeof Shell.getShellUpdateState
>

const MOCK_STATE: State = { mockState: true } as any

describe('UpdateAppModal', () => {
  const closeModal = jest.fn()
  const dismissAlert = jest.fn()

  const render = (props: UpdateAppModalProps) => {
    return mountWithStore<UpdateAppModalProps, State, Action>(
      <UpdateAppModal {...props} />,
      {
        initialState: MOCK_STATE,
      }
    )
  }

  beforeEach(() => {
    getShellUpdateState.mockImplementation((state: State) => {
      expect(state).toBe(MOCK_STATE)
      return {
        info: {
          version: '1.2.3',
          releaseNotes: 'this is a release',
        },
      } as ShellUpdateState
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render an BaseModal using available version from state', () => {
    const { wrapper } = render({ closeModal })
    const modal = wrapper.find(BaseModal)
    const title = modal.find('h2')
    const titleIcon = title.closest(Flex).find(Icon)

    expect(title.text()).toBe('App Version 1.2.3 Available')
    expect(titleIcon.prop('name')).toBe('alert')
  })

  it('should render a <ReleaseNotes> component with the release notes', () => {
    const { wrapper } = render({ closeModal })
    const releaseNotes = wrapper.find(ReleaseNotes)

    expect(releaseNotes.prop('source')).toBe('this is a release')
  })

  it('should render a "Not Now" button that closes the modal', () => {
    const { wrapper } = render({ closeModal })
    const notNowButton = wrapper
      .find('button')
      .filterWhere((b: ReactWrapper<HTMLAttributes>) =>
        /not now/i.test(b.text())
      )

    expect(closeModal).not.toHaveBeenCalled()
    notNowButton.invoke('onClick')?.({} as React.MouseEvent)
    expect(closeModal).toHaveBeenCalled()
  })

  it('should render a "Download" button that starts the update', () => {
    const { wrapper, store } = render({ closeModal })
    const downloadButton = wrapper
      .find('button')
      .filterWhere((b: ReactWrapper) => /download/i.test(b.text()))

    downloadButton.invoke('onClick')?.({} as React.MouseEvent)

    expect(store.dispatch).toHaveBeenCalledWith(Shell.downloadShellUpdate())
  })

  it('should render a spinner if update is downloading', () => {
    getShellUpdateState.mockReturnValue({
      downloading: true,
    } as ShellUpdateState)
    const { wrapper } = render({ closeModal })
    const spinner = wrapper
      .find(Icon)
      .filterWhere(
        (i: ReactWrapper<React.ComponentProps<typeof Icon>>) =>
          i.prop('name') === 'ot-spinner'
      )
    const spinnerParent = spinner.closest(Flex)

    expect(spinnerParent.text()).toMatch(/download in progress/i)
  })

  it('should render a instructional copy instead of release notes if update is downloaded', () => {
    getShellUpdateState.mockReturnValue({
      downloaded: true,
      info: {
        version: '1.2.3',
        releaseNotes: 'this is a release',
      },
    } as ShellUpdateState)

    const { wrapper } = render({ closeModal })
    const title = wrapper.find('h2')

    expect(title.text()).toBe('App Version 1.2.3 Downloaded')
    expect(wrapper.exists(ReleaseNotes)).toBe(false)
    expect(wrapper.text()).toMatch(/Restart your app to complete the update/i)
  })

  it('should render a "Restart App" button if update is downloaded', () => {
    getShellUpdateState.mockReturnValue({
      downloaded: true,
    } as ShellUpdateState)
    const { wrapper, store } = render({ closeModal })
    const restartButton = wrapper
      .find('button')
      .filterWhere((b: ReactWrapper<HTMLAttributes>) =>
        /restart/i.test(b.text())
      )

    restartButton.invoke('onClick')?.({} as React.MouseEvent)
    expect(store.dispatch).toHaveBeenCalledWith(Shell.applyShellUpdate())
  })

  it('should render a "Not Now" button if update is downloaded', () => {
    getShellUpdateState.mockReturnValue({
      downloaded: true,
    } as ShellUpdateState)
    const { wrapper } = render({ closeModal })
    const notNowButton = wrapper
      .find('button')
      .filterWhere((b: ReactWrapper<HTMLAttributes>) =>
        /not now/i.test(b.text())
      )

    notNowButton.invoke('onClick')?.({} as React.MouseEvent)
    expect(closeModal).toHaveBeenCalled()
  })

  it('should render an ErrorModal if the update errors', () => {
    getShellUpdateState.mockReturnValue({
      error: {
        message: 'Could not get code signature for running application',
        name: 'Error',
      },
    } as ShellUpdateState)

    const { wrapper } = render({ closeModal })
    const errorModal = wrapper.find(ErrorModal)

    expect(errorModal.prop('heading')).toBe('Update Error')
    expect(errorModal.prop('description')).toBe(
      'Something went wrong while updating your app'
    )
    expect(errorModal.prop('error')).toEqual({
      message: 'Could not get code signature for running application',
      name: 'Error',
    })

    errorModal.invoke('close')?.()

    expect(closeModal).toHaveBeenCalled()
  })

  it('should call props.dismissAlert via the "Not Now" button', () => {
    const { wrapper } = render({ dismissAlert })
    const notNowButton = wrapper
      .find('button')
      .filterWhere((b: ReactWrapper<HTMLAttributes>) =>
        /not now/i.test(b.text())
      )

    expect(dismissAlert).not.toHaveBeenCalled()
    notNowButton.invoke('onClick')?.({} as React.MouseEvent)
    expect(dismissAlert).toHaveBeenCalledWith(false)
  })

  it('should call props.dismissAlert via the Error modal "close" button', () => {
    getShellUpdateState.mockReturnValue({
      error: {
        message: 'Could not get code signature for running application',
        name: 'Error',
      },
    } as ShellUpdateState)

    const { wrapper } = render({ dismissAlert })
    const errorModal = wrapper.find(ErrorModal)

    errorModal.invoke('close')?.()

    expect(dismissAlert).toHaveBeenCalledWith(false)
  })

  it('should have a button to allow the user to dismiss alerts permanently', () => {
    const { wrapper } = render({ dismissAlert })
    const ignoreButton = wrapper
      .find('button')
      .filterWhere((b: ReactWrapper<HTMLAttributes>) =>
        /turn off update notifications/i.test(b.text())
      )

    ignoreButton.invoke('onClick')?.({} as React.MouseEvent)

    const title = wrapper.find('h2')

    expect(wrapper.exists(ReleaseNotes)).toBe(false)
    expect(title.text()).toMatch(/turned off update notifications/i)
    expect(wrapper.text()).toMatch(
      /You've chosen to not be notified when an app update is available/
    )
  })

  it('should not show the "ignore" button if modal was not alert triggered', () => {
    const { wrapper } = render({ closeModal })
    const ignoreButton = wrapper
      .find('button')
      .filterWhere((b: ReactWrapper<HTMLAttributes>) =>
        /turn off update notifications/i.test(b.text())
      )

    expect(ignoreButton.exists()).toBe(false)
  })

  it('should not show the "ignore" button if the user has proceeded with the update', () => {
    getShellUpdateState.mockReturnValue({
      downloaded: true,
    } as ShellUpdateState)

    const { wrapper } = render({ dismissAlert })
    const ignoreButton = wrapper
      .find('button')
      .filterWhere((b: ReactWrapper<HTMLAttributes>) =>
        /turn off update notifications/i.test(b.text())
      )

    expect(ignoreButton.exists()).toBe(false)
  })

  it('should dismiss the alert permanently once the user clicks "OK"', () => {
    const { wrapper } = render({ dismissAlert })

    wrapper
      .find('button')
      .filterWhere((b: ReactWrapper<HTMLAttributes>) =>
        /turn off update notifications/i.test(b.text())
      )
      .invoke('onClick')?.({} as React.MouseEvent)

    wrapper
      .find('button')
      .filterWhere((b: ReactWrapper<HTMLAttributes>) => /ok/i.test(b.text()))
      .invoke('onClick')?.({} as React.MouseEvent)

    expect(dismissAlert).toHaveBeenCalledWith(true)
  })

  it('should dismiss the alert permanently if the component unmounts, for safety', () => {
    const { wrapper } = render({ dismissAlert })

    wrapper
      .find('button')
      .filterWhere((b: ReactWrapper<HTMLAttributes>) =>
        /turn off update notifications/i.test(b.text())
      )
      .invoke('onClick')?.({} as React.MouseEvent)

    wrapper.unmount()

    expect(dismissAlert).toHaveBeenCalledWith(true)
  })

  it('should have a link to /more/app that also dismisses alert permanently', () => {
    const { wrapper } = render({ dismissAlert })

    wrapper
      .find('button')
      .filterWhere((b: ReactWrapper<HTMLAttributes>) =>
        /turn off update notifications/i.test(b.text())
      )
      .invoke('onClick')?.({} as React.MouseEvent)

    wrapper
      .find(InternalLink)
      .filterWhere(
        (b: ReactWrapper<React.ComponentProps<typeof InternalLink>>) =>
          b.prop('to') === '/more/app'
      )
      .invoke('onClick')?.({} as React.MouseEvent<HTMLAnchorElement>)

    expect(dismissAlert).toHaveBeenCalledWith(true)
  })

  it('should not send dismissal via unmount if button is close button clicked', () => {
    const { wrapper } = render({ dismissAlert })
    const notNowButton = wrapper
      .find('button')
      .filterWhere((b: ReactWrapper<HTMLAttributes>) =>
        /not now/i.test(b.text())
      )

    notNowButton.invoke('onClick')?.({} as React.MouseEvent)
    wrapper.unmount()

    expect(dismissAlert).toHaveBeenCalledTimes(1)
    expect(dismissAlert).toHaveBeenCalledWith(false)
  })
})
