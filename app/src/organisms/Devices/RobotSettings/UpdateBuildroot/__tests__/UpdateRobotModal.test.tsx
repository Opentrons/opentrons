import * as React from 'react'
import { createStore } from 'redux'
import { i18n } from '../../../../../i18n'
import { fireEvent } from '@testing-library/react'
import * as RobotUpdate from '../../../../../redux/robot-update'
import { renderWithProviders } from '@opentrons/components'
import { UpdateRobotModal } from '../UpdateRobotModal'
import type { Store } from 'redux'
import type { State } from '../../../../../redux/types'

jest.mock('../../../../../redux/robot-update')
jest.mock('../../../../UpdateAppModal', () => ({
  UpdateAppModal: () => null,
}))

const getRobotUpdateDisplayInfo = RobotUpdate.getRobotUpdateDisplayInfo as jest.MockedFunction<
  typeof RobotUpdate.getRobotUpdateDisplayInfo
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
    }
    getRobotUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: 'test',
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders an update available header if the type is not Balena', () => {
    const [{ getByText }] = render(props)
    getByText('test robot Update Available')
  })

  it('renders a special update  header if the type is Balena', () => {
    props = {
      ...props,
      systemType: 'ot2-balena',
    }
    const [{ getByText }] = render(props)
    getByText('Robot Operating System Update')
  })

  it('renders release notes and a modal header close icon', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByText('test notes')

    const exitIcon = getByTestId(
      'ModalHeader_icon_close_test robot Update Available'
    )
    fireEvent.click(exitIcon)
    expect(props.closeModal).toHaveBeenCalled()
  })

  it('renders remind me later and and disabled update robot now buttons', () => {
    const [{ getByText }] = render(props)
    getByText('test notes')

    const remindMeLater = getByText('Remind me later')
    const updateNow = getByText('Update robot now')
    expect(updateNow).toBeDisabled()
    fireEvent.click(remindMeLater)
    expect(props.closeModal).toHaveBeenCalled()
  })
})
