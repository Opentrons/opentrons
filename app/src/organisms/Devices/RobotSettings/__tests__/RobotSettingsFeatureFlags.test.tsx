import { screen } from '@testing-library/react'
import { when } from 'vitest-when'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'

import { RobotSettingsFeatureFlags } from '../RobotSettingsFeatureFlags'

import { getRobotSettings } from '/app/redux/robot-settings'

vi.mock('/app/redux/robot-settings')

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
    when(getRobotSettings)
      .calledWith(expect.any(Object), 'otie')
      .thenReturn([
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
      ])
  })

  it('should render Toggle for both feature flags and none of the settings', () => {
    render()
    screen.getByText('some feature flag 1')
    screen.getByText('some feature flag 2')
    expect(screen.queryByText('some setting')).toBeFalsy()
  })
})
