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

  const getUseTrashForTipCalToggle = wrapper =>
    wrapper.find('LabeledToggle[data-test="useTrashSurfaceForTipCalToggle"]')

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
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders evergreen settings', () => {
    const { wrapper } = render()

    expect(getUpdateChannelSelect(wrapper).exists()).toBe(true)
    expect(getDevtoolsToggle(wrapper).exists()).toBe(true)
  })

  it('does not render optional settings when not present', () => {
    const { wrapper } = render()

    expect(getUseTrashForTipCalToggle(wrapper).exists()).toBe(false)
  })

  it('does render optional settings when present', () => {
    getUseTrashSurfaceForTipCal.mockReturnValue(false)
    const { wrapper } = render()

    expect(getUseTrashForTipCalToggle(wrapper).exists()).toBe(true)
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
    getUseTrashSurfaceForTipCal.mockReturnValue(false)
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

    getUseTrashForTipCalToggle(wrapper).invoke('onClick')()
    wrapper.update()
    expect(store.dispatch).toHaveBeenCalledWith(
      Config.toggleConfigValue('calibration.useTrashSurfaceForTipCal')
    )
  })
})
