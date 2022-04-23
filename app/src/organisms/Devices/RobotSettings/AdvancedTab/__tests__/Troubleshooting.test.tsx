import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
// import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { mockConnectableRobot } from '../../../../../redux/discovery/__fixtures__'

import { Troubleshooting } from '../Troubleshooting'

jest.mock('../../../../../redux/shell/robot-logs/selectors')

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <Troubleshooting robot={mockConnectableRobot} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings Troubleshooting', () => {
  it('should render title, description, and button', () => {
    const [{ getByText, getByRole, getByTestId }] = render()
    getByText('Troubleshooting')
    getByTestId('RobotSettings_Troubleshooting')
    getByRole('button', { name: 'Download logs' })
  })

  it('should show the download toast when clicking download logs button', () => {})
})
