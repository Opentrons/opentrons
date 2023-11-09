import * as React from 'react'
import { createStore } from 'redux'
import { when } from 'jest-when'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import {
  getRobotUpdateDisplayInfo,
  getRobotUpdateVersion,
} from '../../../../../redux/robot-update'
import { getDiscoverableRobotByName } from '../../../../../redux/discovery'
import { UpdateRobotModal, RELEASE_NOTES_URL_BASE } from '../UpdateRobotModal'
import type { Store } from 'redux'

import type { State } from '../../../../../redux/types'

jest.mock('../../../../../redux/robot-update')
jest.mock('../../../../../redux/discovery')
jest.mock('../../../../UpdateAppModal', () => ({
  UpdateAppModal: () => null,
}))

const mockGetRobotUpdateDisplayInfo = getRobotUpdateDisplayInfo as jest.MockedFunction<
  typeof getRobotUpdateDisplayInfo
>
const mockGetDiscoverableRobotByName = getDiscoverableRobotByName as jest.MockedFunction<
  typeof getDiscoverableRobotByName
>
const mockGetRobotUpdateVersion = getRobotUpdateVersion as jest.MockedFunction<
  typeof getRobotUpdateVersion
>

const render = (props: React.ComponentProps<typeof UpdateRobotModal>) => {
  return renderWithProviders(<UpdateRobotModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('UpdateRobotModal', () => {
  let props: React.ComponentProps<typeof UpdateRobotModal>
  let store: Store<State>
  beforeEach(() => {
    store = createStore(jest.fn(), {})
    store.dispatch = jest.fn()
    props = {
      robotName: 'test robot',
      releaseNotes: 'test notes',
      systemType: 'flex',
      closeModal: jest.fn(),
      updateType: 'upgrade',
    }
    when(mockGetRobotUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: 'test',
    })
    when(mockGetDiscoverableRobotByName).mockReturnValue(null)
    when(mockGetRobotUpdateVersion).mockReturnValue('7.0.0')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders an update available header if the type is not Balena when upgrading', () => {
    const [{ getByText }] = render(props)
    getByText('test robot Update Available')
  })

  it('renders a special update  header if the type is Balena', () => {
    props = {
      ...props,
      systemType: 'ot2-balena',
    }
    const [{ getByText }] = render(props)
    getByText('Robot Operating System Update Available')
  })

  it('renders release notes and a modal header close icon when upgrading', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByText('test notes')

    const exitIcon = getByTestId(
      'ModalHeader_icon_close_test robot Update Available'
    )
    fireEvent.click(exitIcon)
    expect(props.closeModal).toHaveBeenCalled()
  })

  it('renders remind me later and and disabled update robot now buttons when upgrading', () => {
    const [{ getByText }] = render(props)
    getByText('test notes')

    const remindMeLater = getByText('Remind me later')
    const updateNow = getByText('Update robot now')
    expect(updateNow).toBeDisabled()
    fireEvent.click(remindMeLater)
    expect(props.closeModal).toHaveBeenCalled()
  })

  it('renders a release notes link pointing to the Github releases page', () => {
    const [{ getByText }] = render(props)

    const link = getByText('Release notes')
    expect(link).toHaveAttribute('href', RELEASE_NOTES_URL_BASE + '7.0.0')
  })

  it('renders proper text when reinstalling', () => {
    props = {
      ...props,
      updateType: 'reinstall',
    }

    const [{ getByText, queryByText }] = render(props)
    getByText('Robot is up to date')
    queryByText('It looks like your robot is already up to date')
    getByText('Not now')
    getByText('Update robot now')
  })

  it('renders proper text when downgrading', () => {
    props = {
      ...props,
      updateType: 'downgrade',
    }

    const [{ getByText }] = render(props)
    getByText('test robot Update Available')
    getByText('Not now')
    getByText('Update robot now')
  })
})
