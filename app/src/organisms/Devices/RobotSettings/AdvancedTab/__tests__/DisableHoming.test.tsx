import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { UseQueryResult } from 'react-query'

import { renderWithProviders } from '@opentrons/components'
import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../../../i18n'
import { getRobotSettings } from '../../../../../redux/robot-settings'
import { useCurrentRunId } from '../../../../ProtocolUpload/hooks'

import { DisableHoming } from '../DisableHoming'

import type { Sessions } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../../redux/robot-settings/selectors')
jest.mock('../../../../ProtocolUpload/hooks')

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
  id: 'homing-test',
  title: 'Disable home on boot',
  description: 'Disable home on boot test',
  value: true,
  restart_required: false,
}

const mockUpdateRobotStatus = jest.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <DisableHoming
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
    getByText('Disable homing the gantry when restarting robot')
    getByText('Prevent robot from homing motors when the robot restarts.')
    const toggleButton = getByRole('switch', { name: 'disable_homing' })
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
      name: 'disable_homing',
    })
    fireEvent.click(toggleButton)
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should call update robot status if a robot is busy', () => {
    const [{ getByRole }] = render()
    const toggleButton = getByRole('switch', {
      name: 'disable_homing',
    })
    fireEvent.click(toggleButton)
    expect(mockUpdateRobotStatus).toHaveBeenCalled()
  })
})
