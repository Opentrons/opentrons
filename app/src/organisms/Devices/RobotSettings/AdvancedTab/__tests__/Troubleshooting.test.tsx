import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { act, waitFor } from '@testing-library/react'
import { resetAllWhenMocks, when } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { i18n } from '../../../../../i18n'
import { useToaster } from '../../../../../organisms/ToasterOven'
import {
  mockConnectableRobot,
  mockUnreachableRobot,
} from '../../../../../redux/discovery/__fixtures__'
import { useRobot } from '../../../hooks'
import { Troubleshooting } from '../Troubleshooting'

import type { HostConfig } from '@opentrons/api-client'
import { ToasterContextType } from '../../../../ToasterOven/ToasterContext'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../../organisms/ToasterOven')
jest.mock('../../../../../redux/discovery/selectors')
jest.mock('../../../hooks')

const mockUseHost = useHost as jest.MockedFunction<typeof useHost>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockUseToaster = useToaster as jest.MockedFunction<typeof useToaster>

const ROBOT_NAME = 'otie'
const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const MOCK_MAKE_TOAST = jest.fn()
const MOCK_EAT_TOAST = jest.fn()

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
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUseToaster)
      .calledWith()
      .mockReturnValue(({
        makeToast: MOCK_MAKE_TOAST,
        eatToast: MOCK_EAT_TOAST,
      } as unknown) as ToasterContextType)
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

  it('should initiate log download when clicking Download logs button', async () => {
    const [{ getByRole, queryByText }] = render()
    const downloadLogsButton = getByRole('button', { name: 'Download logs' })
    act(() => {
      downloadLogsButton.click()
    })
    expect(downloadLogsButton).toBeDisabled()
    expect(MOCK_MAKE_TOAST).toBeCalledWith('Downloading logs...', 'info', {
      disableTimeout: true,
      icon: { name: 'ot-spinner', spin: true },
    })
    await waitFor(() => {
      expect(queryByText('Downloading logs...')).toBeNull()
    })
    await waitFor(() => {
      expect(downloadLogsButton).not.toBeDisabled()
    })
  })
})
