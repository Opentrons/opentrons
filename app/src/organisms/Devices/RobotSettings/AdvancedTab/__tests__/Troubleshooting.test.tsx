import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
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
  afterEach(() => {
    jest.resetAllMocks()
  })
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

  it('should call updateDownloadLogsStatus when clicking Download logs button', () => {
    const [{ getByRole }] = render(mockConnectableRobot)
    const downloadLogsButton = getByRole('button', { name: 'Download logs' })
    fireEvent.click(downloadLogsButton)
    expect(mockUpdateDownloadLogsStatus).toHaveBeenCalled()
  })
})
