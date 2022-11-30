import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { resetAllWhenMocks, when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import {
  mockConnectableRobot,
  mockUnreachableRobot,
} from '../../../../../redux/discovery/__fixtures__'
import { downloadLogs } from '../../../../../redux/shell/robot-logs/actions'
import { useRobot } from '../../../hooks'

import { Troubleshooting } from '../Troubleshooting'

jest.mock('../../../../../redux/shell/robot-logs/actions')
jest.mock('../../../../../redux/shell/robot-logs/selectors')
jest.mock('../../../../../redux/discovery/selectors')
jest.mock('../../../hooks')

const mockDownloadLogs = downloadLogs as jest.MockedFunction<
  typeof downloadLogs
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>

const ROBOT_NAME = 'otie'

const render = (robotName = ROBOT_NAME) => {
  return renderWithProviders(
    <MemoryRouter>
      <Troubleshooting robotName={robotName} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings Troubleshooting', () => {
  beforeEach(() => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockConnectableRobot)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })
  it('should render title, description, and button', () => {
    const [{ getByText, getByRole, getByTestId }] = render()
    getByText('Troubleshooting')
    getByTestId('RobotSettings_Troubleshooting')
    getByRole('button', { name: 'Download logs' })
  })

  it('should be disabled when logs are not available', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockUnreachableRobot)
    const [{ getByRole }] = render()
    const downloadLogsButton = getByRole('button', { name: 'Download logs' })
    expect(downloadLogsButton).toBeDisabled()
  })

  it('should call downloadLogs when clicking Download logs button', () => {
    const [{ getByRole }] = render()
    const downloadLogsButton = getByRole('button', { name: 'Download logs' })
    fireEvent.click(downloadLogsButton)
    expect(mockDownloadLogs).toHaveBeenCalled()
  })
})
