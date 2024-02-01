import * as React from 'react'
import { when } from 'jest-when'
import { screen, fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Shell from '../../../redux/shell'
import { useRemoveActiveAppUpdateToast } from '../../Alerts'
import { UpdateAppModal, UpdateAppModalProps, RELEASE_NOTES_URL_BASE } from '..'

import type { State } from '../../../redux/types'
import type { ShellUpdateState } from '../../../redux/shell/types'

jest.mock('../../../redux/shell/update', () => ({
  ...jest.requireActual<{}>('../../../redux/shell/update'),
  getShellUpdateState: jest.fn(),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: jest.fn(),
  }),
}))
jest.mock('../../Alerts')

const getShellUpdateState = Shell.getShellUpdateState as jest.MockedFunction<
  typeof Shell.getShellUpdateState
>
const mockUseRemoveActiveAppUpdateToast = useRemoveActiveAppUpdateToast as jest.MockedFunction<
  typeof useRemoveActiveAppUpdateToast
>

const render = (props: React.ComponentProps<typeof UpdateAppModal>) => {
  return renderWithProviders(<UpdateAppModal {...props} />, {
    i18nInstance: i18n,
    initialState: {
      shell: { update: { info: { version: '7.0.0' }, available: true } },
    },
  })
}

describe('UpdateAppModal', () => {
  let props: React.ComponentProps<typeof UpdateAppModal>

  beforeEach(() => {
    props = {
      closeModal: jest.fn(),
    } as UpdateAppModalProps
    getShellUpdateState.mockImplementation((state: State) => {
      return {
        downloading: false,
        available: true,
        downloaded: false,
        downloadPercentage: 0,
        error: null,
        info: {
          version: '1.2.3',
          releaseNotes: 'this is a release',
        },
      } as ShellUpdateState
    })
    when(mockUseRemoveActiveAppUpdateToast).calledWith().mockReturnValue({
      removeActiveAppUpdateToast: jest.fn(),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders update available title and release notes when update is available', () => {
    render(props)
    expect(
      screen.getByText('Opentrons App Update Available')
    ).toBeInTheDocument()
    expect(screen.getByText('this is a release')).toBeInTheDocument()
  })
  it('closes modal when "remind me later" button is clicked', () => {
    const closeModal = jest.fn()
    render({ ...props, closeModal })
    fireEvent.click(screen.getByText('Remind me later'))
    expect(closeModal).toHaveBeenCalled()
  })

  it('renders a release notes link pointing to the Github releases page', () => {
    render(props)

    const link = screen.getByText('Release notes')
    expect(link).toHaveAttribute('href', RELEASE_NOTES_URL_BASE + '7.0.0')
  })

  it('shows error modal on error', () => {
    getShellUpdateState.mockReturnValue({
      error: {
        message: 'Could not get code signature for running application',
        name: 'Error',
      },
    } as ShellUpdateState)
    render(props)
    expect(screen.getByText('Update Error')).toBeInTheDocument()
  })
  it('shows a download progress bar when downloading', () => {
    getShellUpdateState.mockReturnValue({
      downloading: true,
      downloadPercentage: 50,
    } as ShellUpdateState)
    render(props)
    expect(screen.getByText('Downloading update...')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
  it('renders download complete text when download is finished', () => {
    getShellUpdateState.mockReturnValue({
      downloading: false,
      downloaded: true,
    } as ShellUpdateState)
    render(props)
    expect(
      screen.getByText('Download complete, restarting the app...')
    ).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(getComputedStyle(screen.getByTestId('ProgressBar_Bar')).width).toBe(
      '100%'
    )
  })
  it('renders an error message when an error occurs', () => {
    getShellUpdateState.mockReturnValue({
      error: { name: 'Update Error' },
    } as ShellUpdateState)
    render(props)
    expect(screen.getByTitle('Update Error')).toBeInTheDocument()
  })
})
