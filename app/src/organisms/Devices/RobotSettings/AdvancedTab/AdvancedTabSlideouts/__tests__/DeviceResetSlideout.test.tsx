import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../../i18n'
import { getResetConfigOptions } from '../../../../../../redux/robot-admin'
import { useIsOT3 } from '../../../../hooks'
import { DeviceResetSlideout } from '../DeviceResetSlideout'

jest.mock('../../../../../../redux/config')
jest.mock('../../../../../../redux/discovery')
jest.mock('../../../../../../redux/robot-admin/selectors')
jest.mock('../../../../hooks')

const mockOnCloseClick = jest.fn()
const ROBOT_NAME = 'otie'
const mockUpdateResetStatus = jest.fn()

const mockGetResetConfigOptions = getResetConfigOptions as jest.MockedFunction<
  typeof getResetConfigOptions
>
const mockUseIsOT3 = useIsOT3 as jest.MockedFunction<typeof useIsOT3>

const mockResetConfigOptions = [
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
    id: 'tipLengthCalibrations',
    name: 'tip length FooBar',
    description: 'tip length fooBar description',
  },
]

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <DeviceResetSlideout
        isExpanded={true}
        onCloseClick={mockOnCloseClick}
        robotName={ROBOT_NAME}
        updateResetStatus={mockUpdateResetStatus}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DeviceResetSlideout', () => {
  beforeEach(() => {
    mockGetResetConfigOptions.mockReturnValue(mockResetConfigOptions)
    mockUseIsOT3.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description, checkboxes, links and button: OT-2', () => {
    const [{ getByText, getByRole, getAllByText, getByTestId }] = render()
    getByText('Device Reset')
    getByText('Resets cannot be undone')
    getByText('Clear individual data')
    getByText('Select individual settings to only clear specific data types.')
    getByText('Robot Calibration Data')
    getByText('Clear deck calibration')
    getByText('Clear pipette offset calibrations')
    getByText('Clear tip length calibrations')
    getByText('Protocol run History')
    getByText('Clear protocol run history')
    getByText('Boot scripts')
    getByText('Clear custom boot scripts')
    const downloads = getAllByText('Download')
    expect(downloads.length).toBe(2)
    getByRole('checkbox', { name: 'Clear deck calibration' })
    getByRole('checkbox', { name: 'Clear pipette offset calibrations' })
    getByRole('checkbox', { name: 'Clear tip length calibrations' })
    getByRole('checkbox', { name: 'Clear protocol run history' })
    getByRole('checkbox', { name: 'Clear custom boot scripts' })
    getByRole('button', { name: 'Clear data and restart robot' })
    getByTestId('Slideout_icon_close_Device Reset')
  })

  it('should change some options and text for Flex', () => {
    mockUseIsOT3.mockReturnValue(true)
    const [{ getByText, getByRole, queryByRole, queryByText }] = render()
    getByText('Clear all data')
    getByText(
      'Resets all settings. You’ll have to redo initial setup before using the robot again.'
    )
    expect(queryByText('Clear deck calibration')).toBeNull()
    getByText('Clear pipette calibration(s)')
    expect(queryByText('Clear tip length calibrations')).toBeNull()
    getByText('Clear gripper calibration')
    getByRole('checkbox', { name: 'Clear pipette calibration(s)' })
    getByRole('checkbox', { name: 'Clear gripper calibration' })
    expect(
      queryByRole('checkbox', { name: 'Clear deck calibration' })
    ).toBeNull()
    expect(
      queryByRole('checkbox', { name: 'Clear tip length calibrations' })
    ).toBeNull()
  })

  it('should enable Clear data and restart robot button when checked one checkbox', () => {
    const [{ getByRole }] = render()
    const checkbox = getByRole('checkbox', { name: 'Clear deck calibration' })
    fireEvent.click(checkbox)
    const clearButton = getByRole('button', {
      name: 'Clear data and restart robot',
    })
    expect(clearButton).toBeEnabled()
  })

  it('should close the slideout when clicking close icon button', () => {
    const [{ getByTestId }] = render()
    const closeButton = getByTestId('Slideout_icon_close_Device Reset')
    fireEvent.click(closeButton)
    expect(mockOnCloseClick).toHaveBeenCalled()
  })
})
