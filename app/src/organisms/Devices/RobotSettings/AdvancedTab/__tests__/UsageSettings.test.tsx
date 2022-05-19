import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { UseQueryResult } from 'react-query'

import { renderWithProviders } from '@opentrons/components'
import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../../../i18n'
import { getRobotSettings } from '../../../../../redux/robot-settings'
import { useCurrentRunId } from '../../../../ProtocolUpload/hooks'

import { UsageSettings } from '../UsageSettings'

import type { Sessions } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../../redux/robot-settings/selectors')
jest.mock('../../../../ProtocolUpload/hooks')

const mockUpdateRobotStatus = jest.fn()
const mockGetRobotSettings = getRobotSettings as jest.MockedFunction<
  typeof getRobotSettings
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseAllSessionsQuery = useAllSessionsQuery as jest.MockedFunction<
  typeof useAllSessionsQuery
>

const mockSettings = {
  id: 'enableDoorSafetySwitch',
  title: 'Enable robot door safety switch',
  description:
    'Automatically pause protocols when robot door opens. Opening the robot door during a run will pause your robot only after it has completed its current motion.',
  value: true,
  restart_required: false,
}

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <UsageSettings
        settings={mockSettings}
        robotName="otie"
        updateIsRobotBusy={mockUpdateRobotStatus}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DisableHoming', () => {
  beforeEach(() => {
    mockGetRobotSettings.mockReturnValue([mockSettings])
    mockUseCurrentRunId.mockReturnValue('123')
    mockUseAllSessionsQuery.mockReturnValue({
      data: {},
    } as UseQueryResult<Sessions, Error>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description and toggle button', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Usage Settings')
    getByText('Pause protocol when robot door opens')
    getByText(
      'When enabled, opening the robot door during a run will pause the robot after it has completed its current motion.'
    )
    const toggleButton = getByRole('switch', {
      name: 'usage_settings_pause_protocol',
    })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should change the value when a user clicks a toggle button', () => {
    const tempMockSettings = {
      ...mockSettings,
      value: false,
    }
    mockGetRobotSettings.mockReturnValue([tempMockSettings])
    mockUseCurrentRunId.mockReturnValue(null)
    const [{ getByRole }] = render()
    const toggleButton = getByRole('switch', {
      name: 'usage_settings_pause_protocol',
    })
    fireEvent.click(toggleButton)
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should call update robot status if a robot is busy', () => {
    const [{ getByRole }] = render()
    const toggleButton = getByRole('switch', {
      name: 'usage_settings_pause_protocol',
    })
    fireEvent.click(toggleButton)
    expect(mockUpdateRobotStatus).toHaveBeenCalled()
  })
})
