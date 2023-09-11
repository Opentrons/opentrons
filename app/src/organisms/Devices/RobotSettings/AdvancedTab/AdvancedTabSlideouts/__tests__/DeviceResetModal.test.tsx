import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { useUpdateRobotNameMutation } from '@opentrons/react-api-client'

import { i18n } from '../../../../../../i18n'
import {
  resetConfig,
  getResetConfigOptions,
} from '../../../../../../redux/robot-admin'
import { useDispatchApiRequest } from '../../../../../../redux/robot-api'
import { getRobotSerialNumber } from '../../../../../../redux/discovery'
import { useIsOT3, useRobot } from '../../../../hooks'
import { mockConnectableRobot } from '../../../../../../redux/discovery/__fixtures__'
import { DeviceResetModal } from '../DeviceResetModal'

import type { State } from '../../../../../../redux/types'
import type { DispatchApiRequestType } from '../../../../../../redux/robot-api'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../hooks')
jest.mock('../../../../../../redux/robot-admin')
jest.mock('../../../../../../redux/robot-api')
jest.mock('../../../../../../redux/discovery')
jest.mock('../../../../hooks')

const mockResetConfig = resetConfig as jest.MockedFunction<typeof resetConfig>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>
const mockUseUpdateRobotNameMutation = useUpdateRobotNameMutation as jest.MockedFunction<
  typeof useUpdateRobotNameMutation
>
const mockGetRobotSerialNumber = getRobotSerialNumber as jest.MockedFunction<
  typeof getRobotSerialNumber
>
const mockUseIsOT3 = useIsOT3 as jest.MockedFunction<typeof useIsOT3>
const mockGetResetConfigOptions = getResetConfigOptions as jest.MockedFunction<
  typeof getResetConfigOptions
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>

const mockResetOptions = {}
const mockCloseModal = jest.fn()
const mockUpdateName = jest.fn()
const ROBOT_NAME = 'otie'
const SERIAL_NUMBER = 'mockSerialNumber'
const mockOT2ResetOptions = [
  {
    id: 'bootScripts',
    name: 'BootScript Foo',
    description: 'BootScript foo description',
  },
  {
    id: 'deckCalibration',
    name: 'deck Calibration Bar',
    description: 'deck Calibration bar description',
  },
  {
    id: 'pipetteOffsetCalibrations',
    name: 'pipette calibration FooBar',
    description: 'pipette calibration fooBar description',
  },
  {
    id: 'runsHistory',
    name: 'RunsHistory FooBar',
    description: 'runsHistory fooBar description',
  },
  {
    id: 'tipLengthCalibrations',
    name: 'tip length FooBar',
    description: 'tip length fooBar description',
  },
]
const mockFlexResetOptions = [
  {
    id: 'bootScripts',
    name: 'BootScript Foo',
    description: 'BootScript foo description',
  },
  {
    id: 'pipetteOffsetCalibrations',
    name: 'pipette calibration FooBar',
    description: 'pipette calibration fooBar description',
  },
  {
    id: 'gripperOffsetCalibrations',
    name: 'gripper calibration FooBar',
    description: 'gripper calibration fooBar description',
  },
  {
    id: 'runsHistory',
    name: 'RunsHistory FooBar',
    description: 'runsHistory fooBar description',
  },
]

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
    mockUseUpdateRobotNameMutation.mockReturnValue({
      updateRobotName: mockUpdateName,
    } as any)

    when(mockGetRobotSerialNumber)
      .calledWith(mockConnectableRobot)
      .mockReturnValue(SERIAL_NUMBER)
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(false)
    when(mockGetResetConfigOptions)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue(mockOT2ResetOptions)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
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

  it('should close the modal when the user clicks the Yes button - OT-2', () => {
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
    clearDataAndRestartRobotButton.click()
    expect(dispatchApiRequest).toBeCalledWith(
      mockResetConfig(ROBOT_NAME, clearMockResetOptions)
    )
  })

  it('should close the modal when the user clicks the Yes button - Flex', () => {
    when(mockUseIsOT3).calledWith('flex').mockReturnValue(true)
    when(mockGetResetConfigOptions)
      .calledWith({} as State, 'flex')
      .mockReturnValue(mockFlexResetOptions)
    const clearMockResetOptions = {
      bootScripts: true,
      gripperOffsetCalibrations: true,
      pipetteOffsetCalibrations: true,
      runsHistory: true,
    }
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    mockGetRobotSerialNumber.mockReturnValue(SERIAL_NUMBER)
    const [{ getByRole }] = render({
      closeModal: mockCloseModal,
      isRobotReachable: true,
      robotName: 'flex',
      resetOptions: clearMockResetOptions,
    })
    const clearDataAndRestartRobotButton = getByRole('button', {
      name: 'Yes, clear data and restart robot',
    })
    clearDataAndRestartRobotButton.click()
    expect(mockUpdateName).toHaveBeenCalledWith(SERIAL_NUMBER)
    expect(dispatchApiRequest).toBeCalledWith(
      mockResetConfig(SERIAL_NUMBER, clearMockResetOptions)
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
    cancelButton.click()
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
    closeIconButton.click()
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
    closeButton.click()
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
    closeIconButton.click()
    expect(mockCloseModal).toHaveBeenCalled()
  })
})
