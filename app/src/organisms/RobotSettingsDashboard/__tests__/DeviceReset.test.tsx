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
    const [{ getByText, getByTestId }] = render(props)
    getByText('Clear pipette calibration(s)')
    getByText('Clear gripper calibration')
    getByText('Clear protocol run history')
    getByText('Clears information about past runs of all protocols.')
    getByText('Clear custom boot scripts')
    getByText(
      "Clears scripts that modify the robot's behavior when powered on."
    )
    expect(getByTestId('DeviceReset_clear_data_button')).toBeDisabled()
  })

  it('when tapping a option button, the clear button is enabled', () => {
    const [{ getByText, getByTestId }] = render(props)
    fireEvent.click(getByText('Clear pipette calibration(s)'))
    expect(getByTestId('DeviceReset_clear_data_button')).not.toBeDisabled()
  })

  it('when tapping a option button and tapping the clear button, a mock function is called', () => {
    const clearMockResetOptions = {
      pipetteOffsetCalibrations: true,
      runsHistory: true,
    }
    const [{ getByText }] = render(props)
    fireEvent.click(getByText('Clear pipette calibration(s)'))
    fireEvent.click(getByText('Clear protocol run history'))
    const clearButton = getByText('Clear data and restart robot')
    fireEvent.click(clearButton)
    expect(dispatchApiRequest).toBeCalledWith(
      mockResetConfig('mockRobot', clearMockResetOptions)
    )
  })
})
