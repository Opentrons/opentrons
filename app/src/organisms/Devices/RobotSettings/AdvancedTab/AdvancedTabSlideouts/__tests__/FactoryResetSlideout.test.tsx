import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../../i18n'
// import { getConfig } from '../../../../../../redux/config'
import { FactoryResetSlideout } from '../FactoryResetSlideout'

jest.mock('../../../../../../redux/config')
jest.mock('../../../../../../redux/discovery')
jest.mock('../../../../../../redux/robot-admin')
jest.mock('../../../../hooks')

const mockCloseOnClick = jest.fn()
const ROBOT_NAME = 'otie'
const mockUpdateResetStatus = jest.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <FactoryResetSlideout
        isExpanded={true}
        onCloseClick={mockCloseOnClick}
        robotName={ROBOT_NAME}
        updateResetStatus={mockUpdateResetStatus}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings FactoryResetSlideout', () => {
  it('should render title, description, checkboxes, links and button', () => {
    const [{ getByText, getByRole, getAllByText }] = render()

    getByText('Factory Reset')
    getByText('Select the robot data to clear.')
    getByText('Factory resets cannot be undone')
    getByText('Robot calibration data')
    getByText(
      'Resetting Deck and/or Tip Length Calibration data will also clear Pipette Offset Calibration data.'
    )
    getByText('Clear Deck Calibration')
    getByText('Clear Pipette Offset Calibrations')
    getByText('Clear Tip Length Calibrations')
    getByText('Protocol Run History')
    const downloads = getAllByText('Download')
    expect(downloads.length).toBe(2)
    getByText('Boot Scripts')
    getByText('Clear custom boot scripts')
    // TODO after CPX team's update need to update this test
    // Protocol Run History
    getByRole('checkbox', { name: 'Clear Deck Calibration' })
    getByRole('checkbox', { name: 'Clear Pipette Offset Calibrations' })
    getByRole('checkbox', { name: 'Clear Tip Length Calibrations' })
    getByRole('checkbox', { name: 'Clear Boot Scripts' })
    getByRole('button', { name: 'Clear data and restart robot' })
  })
})
