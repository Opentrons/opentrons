import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { useUpdateRobotNameMutation } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { getResetConfigOptions, resetConfig } from '../../../redux/robot-admin'
import { useDispatchApiRequest } from '../../../redux/robot-api'
import { getRobotSerialNumber, getLocalRobot } from '../../../redux/discovery'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { DeviceReset } from '../DeviceReset'

import type { State } from '../../../redux/types'
import type { DispatchApiRequestType } from '../../../redux/robot-api'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../redux/robot-admin')
jest.mock('../../../redux/robot-api')
jest.mock('../../../redux/discovery')

const mockGetResetConfigOptions = getResetConfigOptions as jest.MockedFunction<
  typeof getResetConfigOptions
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>
const mockResetConfig = resetConfig as jest.MockedFunction<typeof resetConfig>
const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>
const mockGetRobotSerialNumber = getRobotSerialNumber as jest.MockedFunction<
  typeof getRobotSerialNumber
>
const mockUseUpdateRobotNameMutation = useUpdateRobotNameMutation as jest.MockedFunction<
  typeof useUpdateRobotNameMutation
>

const SERIAL_NUMBER = 'mockSerialNumber'
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
  {
    id: 'onDeviceDisplay',
    name: 'On-Device Display Configuration',
    description:
      'Clear the configuration of the on-device display (touchscreen)',
  },
]
const mockUpdateName = jest.fn()

const render = (props: React.ComponentProps<typeof DeviceReset>) => {
  return renderWithProviders(<DeviceReset {...props} />, { i18nInstance: i18n })
}

describe('DeviceReset', () => {
  let props: React.ComponentProps<typeof DeviceReset>
  let dispatchApiRequest: DispatchApiRequestType

  beforeEach(() => {
    props = {
      robotName: 'mockRobot',
      setCurrentOption: jest.fn(),
    }
    mockGetResetConfigOptions.mockReturnValue(mockFlexResetOptions)
    dispatchApiRequest = jest.fn()
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
    when(mockGetLocalRobot)
      .calledWith({} as State)
      .mockReturnValue(mockConnectableRobot)
    when(mockGetRobotSerialNumber)
      .calledWith(mockConnectableRobot)
      .mockReturnValue(SERIAL_NUMBER)
    mockUseUpdateRobotNameMutation.mockReturnValue({
      updateRobotName: mockUpdateName,
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render text and button', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByText('Clear pipette calibration')
    getByText('Clear gripper calibration')
    getByText('Clear protocol run history')
    getByText('Clears information about past runs of all protocols.')
    getByText('Clear all stored data')
    getByText(
      'Resets all settings. You’ll have to redo initial setup before using the robot again.'
    )
    expect(getByTestId('DeviceReset_clear_data_button')).toBeDisabled()
  })

  it('when tapping a option button, the clear button is enabled', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByText('Clear pipette calibration').click()
    expect(getByTestId('DeviceReset_clear_data_button')).not.toBeDisabled()
  })

  it('when tapping a option button and tapping the clear button, a mock function is called', () => {
    const clearMockResetOptions = {
      pipetteOffsetCalibrations: true,
      runsHistory: true,
    }
    const [{ getByText }] = render(props)
    getByText('Clear pipette calibration').click()
    getByText('Clear protocol run history').click()
    const clearButton = getByText('Clear data and restart robot')
    clearButton.click()
    getByText('Are you sure you want to reset your device?')
    getByText('Confirm').click()
    expect(dispatchApiRequest).toBeCalledWith(
      mockResetConfig('mockRobot', clearMockResetOptions)
    )
  })

  it('should call mock functions when clearing all data', () => {
    const clearMockResetOptions = {
      bootScripts: true,
      gripperOffsetCalibrations: true,
      pipetteOffsetCalibrations: true,
      runsHistory: true,
      onDeviceDisplay: true,
    }
    const [{ getByText }] = render(props)
    getByText('Clear all stored data').click()
    getByText('Clear data and restart robot').click()
    getByText('Confirm').click()
    expect(mockUpdateName).toHaveBeenCalledWith(SERIAL_NUMBER)
    expect(dispatchApiRequest).toBeCalledWith(
      mockResetConfig(SERIAL_NUMBER, clearMockResetOptions)
    )
  })
})
