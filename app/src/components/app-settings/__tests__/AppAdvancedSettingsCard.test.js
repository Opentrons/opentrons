// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'
import * as Config from '../../../config'
import { AppAdvancedSettingsCard } from '../AppAdvancedSettingsCard'

import type { State } from '../../../types'

jest.mock('../../../config/selectors')

const getUseTrashSurfaceForTipCal: JestMockFn<
  [State],
  $Call<typeof Config.getUseTrashSurfaceForTipCal, State>
> = Config.getUseTrashSurfaceForTipCal

const getDevtoolsEnabled: JestMockFn<
  [State],
  $Call<typeof Config.getDevtoolsEnabled, State>
> = Config.getDevtoolsEnabled

const getFeatureFlags: JestMockFn<
  [State],
  $Call<typeof Config.getFeatureFlags, State>
> = Config.getFeatureFlags

const getUpdateChannel: JestMockFn<
  [State],
  $Call<typeof Config.getUpdateChannel, State>
> = Config.getUpdateChannel

const getUpdateChannelOptions: JestMockFn<
  [State],
  $Call<typeof Config.getUpdateChannelOptions, State>
> = Config.getUpdateChannelOptions

const MOCK_STATE: $Shape<State> = { robotApi: {} }

describe('AppAdvancedSettingsCard', () => {
  const render = () => {
    return mountWithStore(<AppAdvancedSettingsCard />, {
      initialState: MOCK_STATE,
    })
  }

  const getUseTrashForTipCalRadioGroup = wrapper =>
    wrapper.find(
      'LabeledRadioGroup[data-test="useTrashSurfaceForTipCalRadioGroup"]'
    )

  const getDevtoolsToggle = wrapper =>
    wrapper.find('LabeledToggle[data-test="enableDevToolsToggle"]')

  const getUpdateChannelSelect = wrapper =>
    wrapper.find('LabeledSelect[data-test="updateChannelSetting"]')

  beforeEach(() => {
    getDevtoolsEnabled.mockReturnValue(false)
    getUpdateChannel.mockReturnValue('latest')
    getUpdateChannelOptions.mockReturnValue([
      { name: 'latest', value: 'latest' },
      { name: 'alpha', value: 'alpha' },
    ])
    getFeatureFlags.mockReturnValue({
      enableBundleUpload: false,
    })
    getUseTrashSurfaceForTipCal.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders evergreen settings', () => {
    const { wrapper } = render()

    expect(getUpdateChannelSelect(wrapper).exists()).toBe(true)
    expect(getDevtoolsToggle(wrapper).exists()).toBe(true)
  })

  const SPECS: Array<{|
    originalSettingValue: boolean | null,
    originalRadioValue: 'always-trash' | 'always-block' | 'always-prompt',
    newSettingValue: boolean | null,
    newRadioValue: 'always-trash' | 'always-block' | 'always-prompt',
  |}> = [
    {
      originalSettingValue: true,
      originalRadioValue: 'always-trash',
      newSettingValue: null,
      newRadioValue: 'always-prompt',
    },
    {
      originalSettingValue: true,
      originalRadioValue: 'always-trash',
      newSettingValue: false,
      newRadioValue: 'always-block',
    },
    {
      originalSettingValue: false,
      originalRadioValue: 'always-block',
      newSettingValue: null,
      newRadioValue: 'always-prompt',
    },
    {
      originalSettingValue: false,
      originalRadioValue: 'always-block',
      newSettingValue: true,
      newRadioValue: 'always-trash',
    },
    {
      originalSettingValue: null,
      originalRadioValue: 'always-prompt',
      newSettingValue: true,
      newRadioValue: 'always-trash',
    },
    {
      originalSettingValue: null,
      originalRadioValue: 'always-prompt',
      newSettingValue: false,
      newRadioValue: 'always-block',
    },
  ]

  SPECS.forEach(spec => {
    it(`calibration block picker renders when setting ${String(
      spec.originalSettingValue
    )} and changes to ${String(spec.newSettingValue)}`, () => {
      getUseTrashSurfaceForTipCal.mockReturnValue(spec.originalSettingValue)

      const { wrapper, store, refresh } = render()

      expect(getUseTrashForTipCalRadioGroup(wrapper).exists()).toBe(true)
      expect(
        getUseTrashForTipCalRadioGroup(wrapper)
          .find(`input[value="${spec.originalRadioValue}"]`)
          .prop('checked')
      ).toBe(true)

      getUseTrashForTipCalRadioGroup(wrapper)
        .find(`input[value="${spec.newRadioValue}"]`)
        .simulate('change', { target: { value: spec.newRadioValue } })

      if (spec.newSettingValue === null) {
        expect(store.dispatch).toHaveBeenCalledWith(
          Config.resetConfigValue('calibration.useTrashSurfaceForTipCal')
        )
      } else {
        expect(store.dispatch).toHaveBeenCalledWith(
          Config.updateConfigValue(
            'calibration.useTrashSurfaceForTipCal',
            spec.newSettingValue
          )
        )
      }

      getUseTrashSurfaceForTipCal.mockReturnValue(spec.newSettingValue)

      refresh({ state: 'value' })
      expect(
        getUseTrashForTipCalRadioGroup(wrapper)
          .find(`input[value="${spec.newRadioValue}"]`)
          .prop('checked')
      ).toBe(true)
    })
  })

  it('does not render dev feature flags when dev tools not enabled', () => {
    const { wrapper } = render()

    expect(wrapper.text().includes('__DEV__')).toBe(false)
  })

  it('does renders dev feature flags when dev tools enabled', () => {
    getDevtoolsEnabled.mockReturnValue(true)
    const { wrapper } = render()

    expect(wrapper.text().includes('__DEV__')).toBe(true)
  })

  it('switching toggles dispatches toggle action', () => {
    const { wrapper, store } = render()
    getDevtoolsToggle(wrapper).invoke('onClick')()
    wrapper.update()
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining(Config.toggleConfigValue('devtools'))
    )

    getUpdateChannelSelect(wrapper).invoke('onChange')({
      target: { value: 'alpha' },
    })
    wrapper.update()
    expect(store.dispatch).toHaveBeenCalledWith(
      Config.updateConfigValue('update.channel', 'alpha')
    )
  })
})
