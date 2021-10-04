import * as React from 'react'
import { mountWithStore } from '@opentrons/components'
import * as Config from '../../../../redux/config'
import { AppAdvancedSettingsCard } from '../AppAdvancedSettingsCard'

import type { State, Action } from '../../../../redux/types'
import type { HTMLAttributes, ReactWrapper } from 'enzyme'

jest.mock('../../../../redux/config/selectors')

const getUseTrashSurfaceForTipCal = Config.getUseTrashSurfaceForTipCal as jest.MockedFunction<
  typeof Config.getUseTrashSurfaceForTipCal
>

const getDevtoolsEnabled = Config.getDevtoolsEnabled as jest.MockedFunction<
  typeof Config.getDevtoolsEnabled
>

const getFeatureFlags = Config.getFeatureFlags as jest.MockedFunction<
  typeof Config.getFeatureFlags
>

const getUpdateChannel = Config.getUpdateChannel as jest.MockedFunction<
  typeof Config.getUpdateChannel
>

const getUpdateChannelOptions = Config.getUpdateChannelOptions as jest.MockedFunction<
  typeof Config.getUpdateChannelOptions
>

const MOCK_STATE: State = { robotApi: {} } as any

describe('AppAdvancedSettingsCard', () => {
  const render = () => {
    return mountWithStore<
      React.ComponentProps<typeof AppAdvancedSettingsCard>,
      State,
      Action
    >(<AppAdvancedSettingsCard />, {
      initialState: MOCK_STATE,
    })
  }

  const getUseTrashForTipCalRadioGroup = (
    wrapper: ReactWrapper<React.ComponentProps<typeof AppAdvancedSettingsCard>>
  ): ReactWrapper =>
    wrapper.find(
      'LabeledRadioGroup[data-test="useTrashSurfaceForTipCalRadioGroup"]'
    )

  const getDevtoolsToggle = (
    wrapper: ReactWrapper<React.ComponentProps<typeof AppAdvancedSettingsCard>>
  ): ReactWrapper<HTMLAttributes> =>
    wrapper.find('LabeledToggle[data-test="enableDevToolsToggle"]')

  const getUpdateChannelSelect = (
    wrapper: ReactWrapper<React.ComponentProps<typeof AppAdvancedSettingsCard>>
  ): ReactWrapper<HTMLAttributes> =>
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

  const SPECS: Array<{
    originalSettingValue: boolean | null
    originalRadioValue: 'always-trash' | 'always-block' | 'always-prompt'
    newSettingValue: boolean | null
    newRadioValue: 'always-trash' | 'always-block' | 'always-prompt'
  }> = [
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

      refresh({ state: 'value' } as any)
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
    getDevtoolsToggle(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining(Config.toggleConfigValue('devtools'))
    )

    getUpdateChannelSelect(wrapper).invoke('onChange')?.({
      target: { value: 'alpha' },
    } as any)
    wrapper.update()
    expect(store.dispatch).toHaveBeenCalledWith(
      Config.updateConfigValue('update.channel', 'alpha')
    )
  })
})
