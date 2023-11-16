import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { getResetConfigOptions, resetConfig } from '../../../redux/robot-admin'
import { useDispatchApiRequest } from '../../../redux/robot-api'

import { DeviceReset } from '../DeviceReset'

import type { DispatchApiRequestType } from '../../../redux/robot-api'

jest.mock('../../../redux/robot-admin')
jest.mock('../../../redux/robot-api')

const mockResetConfigOptions = [
  {
    id: 'pipetteOffsetCalibrations',
    name: 'pipette calibration FooBar',
    description: 'pipette calibration fooBar description',
  },
  {
    id: 'gripperOffsetCalibrations',
    name: 'gripper calibration FooBar',
    description: 'runsHistory fooBar description',
  },
  {
    id: 'runsHistory',
    name: 'RunsHistory FooBar',
    description: 'runsHistory fooBar description',
  },
  {
    id: 'bootScripts',
    name: 'Boot Scripts FooBar',
    description: 'bootScripts fooBar description',
  },
  {
    id: 'moduleCalibration',
    name: 'Module Calibration FooBar',
    description: 'moduleCalibration fooBar description',
  },
  {
    id: 'authorizedKeys',
    name: 'SSH Keys Foo',
    description: 'SSH Keys foo description',
  },
]

const mockGetResetConfigOptions = getResetConfigOptions as jest.MockedFunction<
  typeof getResetConfigOptions
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>
const mockResetConfig = resetConfig as jest.MockedFunction<typeof resetConfig>

const render = (props: React.ComponentProps<typeof DeviceReset>) => {
  return renderWithProviders(
    <DeviceReset {...props} />,

    { i18nInstance: i18n }
  )
}

describe('DeviceReset', () => {
  let props: React.ComponentProps<typeof DeviceReset>
  let dispatchApiRequest: DispatchApiRequestType

  beforeEach(() => {
    props = {
      robotName: 'mockRobot',
      setCurrentOption: jest.fn(),
    }
    mockGetResetConfigOptions.mockReturnValue(mockResetConfigOptions)
    dispatchApiRequest = jest.fn()
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render text and button', () => {
    const [{ getByText, getByTestId, queryByText }] = render(props)
    getByText('Clear pipette calibration')
    getByText('Clear gripper calibration')
    getByText('Clear module calibration')
    getByText('Clear protocol run history')
    getByText('Clears information about past runs of all protocols.')
    getByText('Clear all stored data')
    getByText(
      'Resets all settings. You’ll have to redo initial setup before using the robot again.'
    )
    expect(queryByText('Clear the ssh authorized keys')).not.toBeInTheDocument()
    expect(getByTestId('DeviceReset_clear_data_button')).toBeDisabled()
  })

  it('when tapping a option button, the clear button is enabled', () => {
    const [{ getByText, getByTestId }] = render(props)
    fireEvent.click(getByText('Clear pipette calibration'))
    expect(getByTestId('DeviceReset_clear_data_button')).not.toBeDisabled()
  })

  it('when tapping a option button and tapping the clear button, a mock function is called', () => {
    const clearMockResetOptions = {
      pipetteOffsetCalibrations: true,
      moduleCalibration: true,
      runsHistory: true,
    }
    const [{ getByText }] = render(props)
    fireEvent.click(getByText('Clear pipette calibration'))
    fireEvent.click(getByText('Clear protocol run history'))
    fireEvent.click(getByText('Clear module calibration'))
    const clearButton = getByText('Clear data and restart robot')
    fireEvent.click(clearButton)
    getByText('Are you sure you want to reset your device?')
    fireEvent.click(getByText('Confirm'))
    expect(dispatchApiRequest).toBeCalledWith(
      mockResetConfig('mockRobot', clearMockResetOptions)
    )
  })

  it('when tapping clear all stored data, all options are active', () => {
    const clearMockResetOptions = {
      pipetteOffsetCalibrations: true,
      moduleCalibration: true,
      runsHistory: true,
      gripperOffsetCalibrations: true,
      authorizedKeys: true,
      onDeviceDisplay: true,
    }

    const [{ getByText }] = render(props)
    getByText('Clear all stored data').click()
    const clearButton = getByText('Clear data and restart robot')
    fireEvent.click(clearButton)
    getByText('Are you sure you want to reset your device?')
    fireEvent.click(getByText('Confirm'))
    expect(dispatchApiRequest).toBeCalledWith(
      mockResetConfig('mockRobot', clearMockResetOptions)
    )
  })

  it('when tapping all options except clear all stored data, all options are active', () => {
    const clearMockResetOptions = {
      pipetteOffsetCalibrations: true,
      moduleCalibration: true,
      runsHistory: true,
      gripperOffsetCalibrations: true,
      authorizedKeys: true,
      onDeviceDisplay: true,
    }

    const [{ getByText }] = render(props)
    getByText('Clear pipette calibration').click()
    getByText('Clear gripper calibration').click()
    getByText('Clear module calibration').click()
    getByText('Clear protocol run history').click()
    const clearButton = getByText('Clear data and restart robot')
    fireEvent.click(clearButton)
    getByText('Are you sure you want to reset your device?')
    fireEvent.click(getByText('Confirm'))
    expect(dispatchApiRequest).toBeCalledWith(
      mockResetConfig('mockRobot', clearMockResetOptions)
    )
  })

  it('when tapping clear all stored data and unselect one options, all options are not active', () => {
    const clearMockResetOptions = {
      pipetteOffsetCalibrations: false,
      moduleCalibration: true,
      runsHistory: true,
      gripperOffsetCalibrations: true,
      authorizedKeys: false,
      onDeviceDisplay: false,
    }

    const [{ getByText }] = render(props)
    getByText('Clear all stored data').click()
    getByText('Clear pipette calibration').click()
    const clearButton = getByText('Clear data and restart robot')
    fireEvent.click(clearButton)
    getByText('Are you sure you want to reset your device?')
    fireEvent.click(getByText('Confirm'))
    expect(dispatchApiRequest).toBeCalledWith(
      mockResetConfig('mockRobot', clearMockResetOptions)
    )
  })
})
