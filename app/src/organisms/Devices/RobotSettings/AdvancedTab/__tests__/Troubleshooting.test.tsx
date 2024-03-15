import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { act, waitFor, screen } from '@testing-library/react'
import { when } from 'vitest-when'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../../../__testing-utils__'
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
import type { ToasterContextType } from '../../../../ToasterOven/ToasterContext'

vi.mock('@opentrons/react-api-client')
vi.mock('../../../../../organisms/ToasterOven')
vi.mock('../../../../../redux/discovery/selectors')
vi.mock('../../../hooks')

const ROBOT_NAME = 'otie'
const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const MOCK_MAKE_TOAST = vi.fn()
const MOCK_EAT_TOAST = vi.fn()

const render = (props: React.ComponentProps<typeof Troubleshooting>) => {
  return renderWithProviders(
    <MemoryRouter>
      <Troubleshooting {...props} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings Troubleshooting', () => {
  let props: React.ComponentProps<typeof Troubleshooting>
  beforeEach(() => {
    props = {
      robotName: ROBOT_NAME,
      isEstopNotDisengaged: false,
    }
    when(useRobot).calledWith(ROBOT_NAME).thenReturn(mockConnectableRobot)
    when(useHost).calledWith().thenReturn(HOST_CONFIG)
    when(useToaster)
      .calledWith()
      .thenReturn(({
        makeToast: MOCK_MAKE_TOAST,
        eatToast: MOCK_EAT_TOAST,
      } as unknown) as ToasterContextType)
  })
  it('should render title, description, and button', () => {
    render(props)
    screen.getByText('Troubleshooting')
    screen.getByTestId('RobotSettings_Troubleshooting')
    screen.getByRole('button', { name: 'Download logs' })
  })

  it('should be disabled when logs are not available', () => {
    when(useRobot).calledWith('otie').thenReturn(mockUnreachableRobot)
    render(props)
    const downloadLogsButton = screen.getByRole('button', {
      name: 'Download logs',
    })
    expect(downloadLogsButton).toBeDisabled()
  })

  it('should initiate log download when clicking Download logs button', async () => {
    render(props)
    const downloadLogsButton = screen.getByRole('button', {
      name: 'Download logs',
    })
    act(() => {
      downloadLogsButton.click()
    })
    expect(downloadLogsButton).toBeDisabled()
    expect(MOCK_MAKE_TOAST).toBeCalledWith('Downloading logs...', 'info', {
      disableTimeout: true,
      icon: { name: 'ot-spinner', spin: true },
    })
    await waitFor(() => {
      expect(screen.queryByText('Downloading logs...')).toBeNull()
    })
    await waitFor(() => {
      expect(downloadLogsButton).not.toBeDisabled()
    })
  })

  it('should make donwload button disabled when e-stop is pressed', () => {
    props = { ...props, isEstopNotDisengaged: true }
    render(props)
    expect(screen.getByRole('button', { name: 'Download logs' })).toBeDisabled()
  })
})
