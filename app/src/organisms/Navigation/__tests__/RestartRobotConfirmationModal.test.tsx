import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { restartRobot } from '../../../redux/robot-admin'
import { RestartRobotConfirmationModal } from '../RestartRobotConfirmationModal'

jest.mock('../../../redux/robot-admin')

const mockFunc = jest.fn()
const mockRestartRobot = restartRobot as jest.MockedFunction<
  typeof restartRobot
>
const render = (
  props: React.ComponentProps<typeof RestartRobotConfirmationModal>
) => {
  return renderWithProviders(<RestartRobotConfirmationModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RestartRobotConfirmationModal', () => {
  let props: React.ComponentProps<typeof RestartRobotConfirmationModal>

  beforeEach(() => {
    props = {
      robotName: 'mockRobotName',
      setShowRestartRobotConfirmationModal: mockFunc,
    }
  })

  it('should render text and buttons', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByText('Restart now?')
    getByTestId('restart_robot_confirmation_description')
    getByText('Go back')
    getByText('Restart')
  })

  it('should call a mock function when tapping go back button', () => {
    const [{ getByText }] = render(props)
    getByText('Go back').click()
    expect(mockFunc).toHaveBeenCalled()
  })

  it('should call mock restart function when tapping restart', () => {
    const [{ getByText }] = render(props)
    getByText('Restart').click()
    expect(mockRestartRobot).toHaveBeenCalled()
  })
})
