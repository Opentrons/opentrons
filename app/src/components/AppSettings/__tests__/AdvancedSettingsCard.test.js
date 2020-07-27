// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { StaticRouter } from 'react-router-dom'
import { act } from 'react-dom/test-utils'

import type { State } from '../../../types'
import * as Config from '../../../config'
import { AdvancedSettingsCard } from '../AdvancedSettingsCard'

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

describe('AdvancedSettingsCard', () => {
  let mockStore
  let render
  let dispatch
  let checkUpdate

  const getUseTrashForTipCalToggle = wrapper =>
    wrapper.find('LabeledToggle[data-test="useTrashSurfaceForTipCalToggle"]')

  const getDevtoolsToggle = wrapper =>
    wrapper.find('LabeledToggle[data-test="enableDevToolsToggle"]')

  const getUpdateChannelSelect = wrapper =>
    wrapper.find('LabeledSelect[data-test="updateChannelSetting"]')

  beforeEach(() => {
    checkUpdate = jest.fn()
    dispatch = jest.fn()
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        robotApi: {},
      }),
      dispatch,
    }
    getDevtoolsEnabled.mockReturnValue(false)
    getUpdateChannel.mockReturnValue('latest')
    getUpdateChannelOptions.mockReturnValue([
      { name: 'latest', value: 'latest' },
      { name: 'alpha', value: 'alpha' },
    ])
    getFeatureFlags.mockReturnValue({
      enableBundleUpload: false,
    })

    render = () => {
      const Wrapper = ({ children }: {| children: React.Node |}) => (
        <Provider store={mockStore}>
          <StaticRouter location="/" context={{}}>
            {children}
          </StaticRouter>
        </Provider>
      )
      return mount(<AdvancedSettingsCard checkUpdate={checkUpdate} />, {
        wrappingComponent: Wrapper,
      })
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders evergreen settings', () => {
    const wrapper = render()

    expect(getUpdateChannelSelect(wrapper).exists()).toBe(true)
    expect(getDevtoolsToggle(wrapper).exists()).toBe(true)
  })

  it('does not render optional settings when not present', () => {
    const wrapper = render()

    expect(getUseTrashForTipCalToggle(wrapper).exists()).toBe(false)
  })

  it('does render optional settings when present', () => {
    getUseTrashSurfaceForTipCal.mockReturnValue(false)
    const wrapper = render()

    expect(getUseTrashForTipCalToggle(wrapper).exists()).toBe(true)
  })

  it('does not render dev feature flags when dev tools not enabled', () => {
    const wrapper = render()

    expect(wrapper.text().includes('__DEV__')).toBe(false)
  })

  it('does renders dev feature flags when dev tools enabled', () => {
    getDevtoolsEnabled.mockReturnValue(true)
    const wrapper = render()

    expect(wrapper.text().includes('__DEV__')).toBe(true)
  })

  it('switching toggles dispatches toggle action', () => {
    getUseTrashSurfaceForTipCal.mockReturnValue(false)
    const wrapper = render()
    act(() => {
      getDevtoolsToggle(wrapper).invoke('onClick')()
    })
    wrapper.update()
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      expect.objectContaining(Config.toggleConfigValue('devtools'))
    )

    act(() => {
      getUpdateChannelSelect(wrapper).invoke('onChange')({
        target: { value: 'alpha' },
      })
    })
    wrapper.update()
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      Config.updateConfigValue('update.channel', 'alpha')
    )

    act(() => {
      getUseTrashForTipCalToggle(wrapper).invoke('onClick')()
    })
    wrapper.update()
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      Config.toggleConfigValue('useTrashSurfaceForTipCal')
    )
  })

  it('checks for updates on mount and after channel changes', () => {
    const wrapper = render()

    expect(checkUpdate).toHaveBeenCalledTimes(1)

    getUpdateChannel.mockReturnValue('alpha')
    wrapper.update()

    expect(checkUpdate).toHaveBeenCalledTimes(1)
  })
})
