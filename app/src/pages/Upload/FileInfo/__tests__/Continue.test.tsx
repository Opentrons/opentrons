import * as React from 'react'
import { Provider } from 'react-redux'
import { StaticRouter } from 'react-router-dom'
import { mount } from 'enzyme'
import noop from 'lodash/noop'
import { when } from 'jest-when'

import * as navigation from '../../../../redux/nav'
import { Tooltip } from '@opentrons/components'
import { Continue } from '../Continue'

import type { State } from '../../../../redux/types'
import { NavLocation } from '../../../../redux/nav/types'

jest.mock('../../../../redux/nav')

const MOCK_STATE: State = { mockState: true } as any

const MOCK_STORE = {
  getState: () => MOCK_STATE,
  dispatch: noop,
  subscribe: noop,
} as any

const getCalibrateLocation = navigation.getCalibrateLocation as jest.MockedFunction<
  typeof navigation.getCalibrateLocation
>

describe('Continue to run or calibration button component', () => {
  const render = (
    labwareCalibrated: boolean = false
  ): ReturnType<typeof mount> => {
    return mount(
      <Provider store={MOCK_STORE}>
        <StaticRouter context={{}} location={'/upload/file-info'}>
          <Continue />
        </StaticRouter>
      </Provider>
    )
  }

  const CALIBRATE_LOCATION_ENABLED: NavLocation = {
    id: 'calibrate',
    path: '/calibrate',
    title: 'CALIBRATE',
    iconName: 'ot-calibrate',
    disabledReason: null,
  } as any

  const CALIBRATE_SELECTOR_DISABLED: NavLocation = {
    id: 'calibrate',
    path: '/calibrate',
    title: 'CALIBRATE',
    iconName: 'ot-calibrate',
    disabledReason: 'check your toolbox!',
  } as any

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a link to /calibrate when calibrate page is enabled', () => {
    when(getCalibrateLocation)
      .calledWith(MOCK_STATE)
      .mockReturnValue(CALIBRATE_LOCATION_ENABLED)

    const wrapper = render()
    const link = wrapper.find('a')
    const tooltip = wrapper.find(Tooltip)

    expect(tooltip.exists()).toEqual(false)
    expect(link.children().text()).toEqual('Proceed to Calibrate')
    expect(link.prop('href')).toBe('/calibrate')
  })

  it('renders a tooltip and a noop link when calibrate page is disabled', () => {
    when(getCalibrateLocation)
      .calledWith(MOCK_STATE)
      .mockReturnValue(CALIBRATE_SELECTOR_DISABLED)

    const wrapper = render()
    const link = wrapper.find('a')
    const tooltip = wrapper.find(Tooltip)

    expect(tooltip.exists()).toEqual(true)
    expect(tooltip.prop('children')).toBe(
      CALIBRATE_SELECTOR_DISABLED.disabledReason
    )
    expect(link.prop('className')).toContain('disabled')
    expect(link.prop('href')).toBe('/upload/file-info')
  })
})
