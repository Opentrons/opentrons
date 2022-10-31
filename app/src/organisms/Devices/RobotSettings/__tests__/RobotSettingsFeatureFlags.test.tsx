import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { RobotSettingsFeatureFlags } from '../RobotSettingsFeatureFlags'

import { getRobotSettings } from '../../../../redux/robot-settings'

jest.mock('../../../../redux/robot-settings')

const mockGetRobotSettings = getRobotSettings as jest.MockedFunction<
  typeof getRobotSettings
>

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
    when(mockGetRobotSettings)
      .calledWith(expect.any(Object), 'otie')
      .mockReturnValue([
        MOCK_FF_FIELD,
        { ...MOCK_FF_FIELD, id: 'ff_2', title: 'some feature flag 2' },
        ...[
          'enableDoorSafetySwitch',
          'disableHomeOnBoot',
          'disableHomeOnBoot',
          'deckCalibrationDots',
          'shortFixedTrash',
          'useOldAspirationFunctions',
          'disableLogAggregation',
          'disableFastProtocolUpload',
        ].map(id => ({
          id,
          title: 'some setting',
          description: 'this setting is important',
          value: null,
        })),
      ])
  })

  afterAll(() => {
    resetAllWhenMocks()
  })

  it('should render Toggle for both feature flags and none of the settings', () => {
    const [{ getByText, queryByText }] = render()
    getByText('some feature flag 1')
    getByText('some feature flag 2')
    expect(queryByText('some setting')).toBeFalsy()
  })
})
