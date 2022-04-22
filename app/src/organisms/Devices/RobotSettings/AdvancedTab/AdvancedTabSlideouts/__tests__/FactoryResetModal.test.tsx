import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../../i18n'

import { FactoryResetModal } from '../FactoryResetModal'

const mockResetOptions = {}

const mockCloseModal = jest.fn()
const ROBOT_NAME = 'otie'
const render = (props: React.ComponentProps<typeof FactoryResetModal>) => {
  return renderWithProviders(
    <MemoryRouter>
      <FactoryResetModal {...props} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings FactoryResetModal', () => {
  beforeEach(() => {})

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, icon, description, and buttons', () => {
    const [{ getByText, getByRole }] = render({
      closeModal: mockCloseModal,
      isRobotConnected: true,
      robotName: ROBOT_NAME,
      resetOptions: mockResetOptions,
    })
    getByText('Reset to factory settings?')
    getByText('This data cannot be retrieved later.')
    getByRole('button', { name: 'Cancel' })
    getByRole('button', { name: 'Yes, clear data and restart robot' })
  })

  // it('should call closeModal when the user clicks the Yes button', () => {
  //   const [{ getByText, getByRole }] = render({
  //     closeModal: mockCloseModal,
  //     isRobotConnected: true,
  //     robotName: ROBOT_NAME,
  //     resetOptions: mockResetOptions,
  //   })
  // })

  // it('should close the modal when clicking the Cancel button', () => {
  //   const [{ getByText, getByRole }] = render({
  //     closeModal: mockCloseModal,
  //     isRobotConnected: true,
  //     robotName: ROBOT_NAME,
  //     resetOptions: mockResetOptions,
  //   })
  // })

  it('should close the modal when clicking the close icon button', () => {
    const [{ getByTestId }] = render({
      closeModal: mockCloseModal,
      isRobotConnected: true,
      robotName: ROBOT_NAME,
      resetOptions: mockResetOptions,
    })
    const closeIconButton = getByTestId(
      'Modal_icon_close_Reset to factory settings?'
    )
    fireEvent.click(closeIconButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })

  // UNREACHABLE ROBOT
  it('should render title, icon, description, and button-UNREACHABLE', () => {
    const [{ getByText, getByRole }] = render({
      closeModal: mockCloseModal,
      isRobotConnected: false,
      robotName: ROBOT_NAME,
      resetOptions: {},
    })
    getByText('Connection to robot lost')
    getByText(
      'The Opentrons App is unable to communicate with this robot right now. Double check the USB or Wifi connection to the robot, then try to reconnect.'
    )
    getByRole('button', { name: 'Close' })
  })

  it('should close the modal when clicking the Close button-UNREACHABLE', () => {
    const [{ getByRole }] = render({
      closeModal: mockCloseModal,
      isRobotConnected: false,
      robotName: ROBOT_NAME,
      resetOptions: {},
    })

    const closeButton = getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it('should close the modal when clicking the close icon button-UNREACHABLE', () => {
    const [{ getByTestId }] = render({
      closeModal: mockCloseModal,
      isRobotConnected: false,
      robotName: ROBOT_NAME,
      resetOptions: {},
    })
    const closeIconButton = getByTestId(
      'Modal_icon_close_Connection to robot lost'
    )
    fireEvent.click(closeIconButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })
})
