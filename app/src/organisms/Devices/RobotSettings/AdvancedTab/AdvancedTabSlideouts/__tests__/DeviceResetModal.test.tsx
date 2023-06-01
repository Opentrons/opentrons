import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../../i18n'
import { resetConfig } from '../../../../../../redux/robot-admin'
import { useDispatchApiRequest } from '../../../../../../redux/robot-api'

import { DeviceResetModal } from '../DeviceResetModal'

import type { DispatchApiRequestType } from '../../../../../../redux/robot-api'

jest.mock('../../../../../../redux/robot-admin')
jest.mock('../../../../../../redux/robot-api')

const mockResetConfig = resetConfig as jest.MockedFunction<typeof resetConfig>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>

const mockResetOptions = {}
const mockCloseModal = jest.fn()
const ROBOT_NAME = 'otie'
const render = (props: React.ComponentProps<typeof DeviceResetModal>) => {
  return renderWithProviders(
    <MemoryRouter>
      <DeviceResetModal {...props} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DeviceResetModal', () => {
  let dispatchApiRequest: DispatchApiRequestType
  beforeEach(() => {
    dispatchApiRequest = jest.fn()
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description, and buttons', () => {
    const [{ getByText, getByRole }] = render({
      closeModal: mockCloseModal,
      isRobotReachable: true,
      robotName: ROBOT_NAME,
      resetOptions: mockResetOptions,
    })
    getByText('Reset to factory settings?')
    getByText('This data cannot be retrieved later.')
    getByRole('button', { name: 'cancel' })
    getByRole('button', { name: 'Yes, clear data and restart robot' })
  })

  it('should close the modal when the user clicks the Yes button', () => {
    const clearMockResetOptions = {
      bootScript: true,
      deckCalibration: true,
    }
    const [{ getByRole }] = render({
      closeModal: mockCloseModal,
      isRobotReachable: true,
      robotName: ROBOT_NAME,
      resetOptions: clearMockResetOptions,
    })
    const clearDataAndRestartRobotButton = getByRole('button', {
      name: 'Yes, clear data and restart robot',
    })
    fireEvent.click(clearDataAndRestartRobotButton)
    expect(dispatchApiRequest).toBeCalledWith(
      mockResetConfig(ROBOT_NAME, clearMockResetOptions)
    )
  })

  it('should close the modal when clicking the Cancel button', () => {
    const [{ getByRole }] = render({
      closeModal: mockCloseModal,
      isRobotReachable: true,
      robotName: ROBOT_NAME,
      resetOptions: mockResetOptions,
    })
    const cancelButton = getByRole('button', { name: 'cancel' })
    fireEvent.click(cancelButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it('should close the modal when clicking the close icon button', () => {
    const [{ getByTestId }] = render({
      closeModal: mockCloseModal,
      isRobotReachable: true,
      robotName: ROBOT_NAME,
      resetOptions: mockResetOptions,
    })
    const closeIconButton = getByTestId(
      'ModalHeader_icon_close_Reset to factory settings?'
    )
    fireEvent.click(closeIconButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })

  // UNREACHABLE ROBOT
  it('should render title, description, and button-UNREACHABLE', () => {
    const [{ getByText, getByRole }] = render({
      closeModal: mockCloseModal,
      isRobotReachable: false,
      robotName: ROBOT_NAME,
      resetOptions: {},
    })
    getByText('Connection to robot lost')
    getByText(
      'The Opentrons App is unable to communicate with this robot right now. Double check the USB or Wifi connection to the robot, then try to reconnect.'
    )
    getByRole('button', { name: 'close' })
  })

  it('should close the modal when clicking the Close button-UNREACHABLE', () => {
    const [{ getByRole }] = render({
      closeModal: mockCloseModal,
      isRobotReachable: false,
      robotName: ROBOT_NAME,
      resetOptions: {},
    })

    const closeButton = getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it('should close the modal when clicking the close icon button-UNREACHABLE', () => {
    const [{ getByTestId }] = render({
      closeModal: mockCloseModal,
      isRobotReachable: false,
      robotName: ROBOT_NAME,
      resetOptions: {},
    })
    const closeIconButton = getByTestId(
      'ModalHeader_icon_close_Connection to robot lost'
    )
    fireEvent.click(closeIconButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })
})
