import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { useRobotSettingsQuery, useUpdateRobotSettingMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'

import { RobotSettingsFeatureFlags } from '../RobotSettingsFeatureFlags'

import type { UseQueryResult } from 'react-query'
import type { RobotSettingsResponse } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')

const MOCK_FF_FIELD = {
  id: 'ff_1',
  title: 'some feature flag 1',
  description: 'this flag is important',
  value: null,
  restart_required: false,
}

const render = () => {
  return renderWithProviders(<RobotSettingsFeatureFlags robotName="otie" />)
}

describe('RobotSettings Advanced tab', () => {
  beforeEach(() => {
    vi.mocked(useUpdateRobotSettingMutation).mockReturnValue({
      updateRobotSetting: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateRobotSettingMutation>)
    vi.mocked(useRobotSettingsQuery).mockReturnValue({
      data: {
        settings: [
          MOCK_FF_FIELD,
          { ...MOCK_FF_FIELD, id: 'ff_2', title: 'some feature flag 2' },
          ...[
            'enableDoorSafetySwitch',
            'disableHomeOnBoot',
            'disableHomeOnBoot',
            'deckCalibrationDots',
            'shortFixedTrash',
            'useOldAspirationFunctions',
            'disableFastProtocolUpload',
          ].map(id => ({
            id,
            title: 'some setting',
            description: 'this setting is important',
            value: null,
          })),
        ],
      },
    } as UseQueryResult<RobotSettingsResponse>)
  })

  it('should render Toggle for both feature flags and none of the settings', () => {
    render()
    screen.getByText('some feature flag 1')
    screen.getByText('some feature flag 2')
    expect(screen.queryByText('some setting')).toBeFalsy()
  })
})
