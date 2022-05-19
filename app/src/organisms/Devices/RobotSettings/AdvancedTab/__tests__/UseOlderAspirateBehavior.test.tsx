import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { UseQueryResult } from 'react-query'

import { renderWithProviders } from '@opentrons/components'
import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../../../i18n'
import { getRobotSettings } from '../../../../../redux/robot-settings'
import { useCurrentRunId } from '../../../../ProtocolUpload/hooks'

import { UseOlderAspirateBehavior } from '../UseOlderAspirateBehavior'

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
  id: 'useOldAspirationFunctions',
  title: 'Use older aspirate behavior',
  description:
    'Aspirate with the less accurate volumetric calibrations that were used before version 3.7.0. Use this if you need consistency with pre-v3.7.0 results. This only affects GEN1 P10S, P10M, P50S, P50M, and P300S pipettes.',
  value: true,
  restart_required: false,
}

const mockUpdateRobotStatus = jest.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <UseOlderAspirateBehavior
        settings={mockSettings}
        robotName="otie"
        updateIsRobotBusy={mockUpdateRobotStatus}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings UseOlderAspirateBehavior', () => {
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
    getByText('Use older aspirate behavior')
    getByText(
      'Aspirate with the less accurate volumetric calibrations that were used before version 3.7.0. Use this if you need consistency with pre-v3.7.0 results. This only affects GEN1 P10S, P10M, P50M, and P300S pipettes.'
    )
    const toggleButton = getByRole('switch', {
      name: 'use_older_aspirate_behavior',
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
      name: 'use_older_aspirate_behavior',
    })
    fireEvent.click(toggleButton)
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should check robot status when clicking the toggle button', () => {
    const [{ getByRole }] = render()
    const toggleButton = getByRole('switch', {
      name: 'use_older_aspirate_behavior',
    })
    fireEvent.click(toggleButton)
    expect(mockUpdateRobotStatus).toHaveBeenCalled()
  })
})
