import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { UseQueryResult } from 'react-query'

import { renderWithProviders } from '@opentrons/components'
import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../../../i18n'
import { getRobotSettings } from '../../../../../redux/robot-settings'
import { useCurrentRunId } from '../../../../ProtocolUpload/hooks'

import { UseOlderProtocol } from '../UseOlderProtocol'

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
  id: 'disableFastProtocolUpload',
  title: 'Use older protocol analysis method',
  description:
    'Use an older, slower method of analyzing uploaded protocols. This changes how the OT-2 validates your protocol during the upload step, but does not affect how your protocol actually runs. Opentrons Support might ask you to change this setting if you encounter problems with the newer, faster protocol analysis method.',
  value: true,
  restart_required: false,
}

const mockUpdateRobotStatus = jest.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <UseOlderProtocol
        settings={mockSettings}
        robotName="otie"
        updateIsRobotBusy={mockUpdateRobotStatus}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings ShortTrashBin', () => {
  beforeEach(() => {
    mockGetRobotSettings.mockReturnValue([mockSettings])
    mockUseAllSessionsQuery.mockReturnValue({
      data: {},
    } as UseQueryResult<Sessions, Error>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description and toggle button', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Use older protocol analysis method')
    getByText(
      'Use an older, slower method of analyzing uploaded protocols. This changes how the OT-2 validates your protocol during the upload step, but does not affect how your protocol actually runs. Opentrons Support might ask you to change this setting if you encounter problems with the newer, faster protocol analysis method.'
    )

    const toggleButton = getByRole('switch', {
      name: 'use_older_protocol_analysis_method',
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
      name: 'use_older_protocol_analysis_method',
    })
    fireEvent.click(toggleButton)
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should check robot status when clicking the toggle button', () => {
    const [{ getByRole }] = render()
    const toggleButton = getByRole('switch', {
      name: 'use_older_protocol_analysis_method',
    })
    fireEvent.click(toggleButton)
    expect(mockUpdateRobotStatus).toHaveBeenCalled()
  })
})
