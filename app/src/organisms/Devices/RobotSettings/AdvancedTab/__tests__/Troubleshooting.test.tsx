import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import {
  mockConnectableRobot,
  mockUnreachableRobot,
} from '../../../../../redux/discovery/__fixtures__'

import { Troubleshooting } from '../Troubleshooting'

jest.mock('../../../../../redux/shell/robot-logs/selectors')

const mockUpdateDownloadLogsStatus = jest.fn()

const render = (robot: any) => {
  return renderWithProviders(
    <MemoryRouter>
      <Troubleshooting
        robot={robot}
        updateDownloadLogsStatus={mockUpdateDownloadLogsStatus}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings Troubleshooting', () => {
  it('should render title, description, and button', () => {
    const [{ getByText, getByRole, getByTestId }] = render(mockConnectableRobot)
    getByText('Troubleshooting')
    getByTestId('RobotSettings_Troubleshooting')
    getByRole('button', { name: 'Download logs' })
  })

  it('should be disabled when logs are not available', () => {
    const [{ getByRole }] = render(mockUnreachableRobot)
    const downloadLogsButton = getByRole('button', { name: 'Download logs' })
    expect(downloadLogsButton).toBeDisabled()
  })
})
