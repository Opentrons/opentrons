import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../../i18n'
import { getResetConfigOptions } from '../../../../../../redux/robot-admin'
import { FactoryResetSlideout } from '../FactoryResetSlideout'

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

const mockResetConfigOptions = [
  {
    id: 'bootScriptFoo',
    name: 'BootScript Foo',
    description: 'BootScript foo description',
  },
  {
    id: 'CalibrationBar',
    name: 'Calibration Bar',
    description: 'Calibration bar description',
  },
  {
    id: 'runsHistoryFooBar',
    name: 'RunsHistory FooBar',
    description: 'runsHistory fooBar description',
  },
]

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <FactoryResetSlideout
        isExpanded={true}
        onCloseClick={mockOnCloseClick}
        robotName={ROBOT_NAME}
        updateResetStatus={mockUpdateResetStatus}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings FactoryResetSlideout', () => {
  beforeEach(() => {
    mockGetResetConfigOptions.mockReturnValue(mockResetConfigOptions)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description, checkboxes, links and button', () => {
    const [{ getByText, getByRole, getAllByText, getByTestId }] = render()
    getByText('Factory Reset')
    getByText('Select the robot data to clear.')
    getByText('Factory resets cannot be undone')
    getByText('Robot Calibration Data')
    getByText(
      'Resetting Deck and/or Tip Length Calibration data will also clear Pipette Offset Calibration data.'
    )
    getByText('Protocol Run History')
    getByText('Resetting run history will also clear Labware Offset data.')
    getByText('Clear BootScript Foo')
    getByText('Clear Calibration Bar')
    getByText('RunsHistory FooBar')
    const downloads = getAllByText('Download')
    expect(downloads.length).toBe(2)
    getByRole('checkbox', { name: 'Clear Calibration Bar' })
    getByRole('checkbox', { name: 'Clear BootScript Foo' })
    getByRole('button', { name: 'Clear data and restart robot' })
    getByTestId('Slideout_icon_close_Factory Reset')
  })

  it('should enable Clear data and restart robot button when checked one checkbox', () => {
    const [{ getByRole }] = render()
    const checkbox = getByRole('checkbox', { name: 'Clear Calibration Bar' })
    fireEvent.click(checkbox)
    const clearButton = getByRole('button', {
      name: 'Clear data and restart robot',
    })
    expect(clearButton).toBeEnabled()
  })

  it('should close the slideout when clicking close icon button', () => {
    const [{ getByTestId }] = render()
    const closeButton = getByTestId('Slideout_icon_close_Factory Reset')
    fireEvent.click(closeButton)
    expect(mockOnCloseClick).toHaveBeenCalled()
  })
})
