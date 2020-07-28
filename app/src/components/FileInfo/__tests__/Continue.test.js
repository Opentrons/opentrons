// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { StaticRouter } from 'react-router-dom'
import { mount } from 'enzyme'
import noop from 'lodash/noop'

import * as navigation from '../../../nav'
import { Tooltip } from '@opentrons/components'
import { Continue } from '../Continue'

import type { State } from '../../../types'

jest.mock('../../../nav')

const MOCK_STATE: State = ({ mockState: true }: any)

const MOCK_STORE = {
  getState: () => MOCK_STATE,
  dispatch: noop,
  subscribe: noop,
}

const getCalibrateLocation: JestMockFn<
  [State],
  $Call<typeof navigation.getCalibrateLocation, State>
> = navigation.getCalibrateLocation

function stubSelector<R>(mock: JestMockFn<[State], R>, rVal: R) {
  mock.mockImplementation(state => {
    expect(state).toBe(MOCK_STATE)
    return rVal
  })
}

describe('Continue to run or calibration button component', () => {
  const render = (labwareCalibrated: boolean = false) => {
    return mount(
      <Provider store={MOCK_STORE}>
        <StaticRouter context={{}} location={'/upload/file-info'}>
          <Continue />
        </StaticRouter>
      </Provider>
    )
  }

  const CALIBRATE_LOCATION_ENABLED = {
    id: 'calibrate',
    path: '/calibrate',
    title: 'CALIBRATE',
    iconName: 'ot-calibrate',
    disabledReason: null,
  }

  const CALIBRATE_SELECTOR_DISABLED = {
    id: 'calibrate',
    path: '/calibrate',
    title: 'CALIBRATE',
    iconName: 'ot-calibrate',
    disabledReason: 'check your toolbox!',
  }

  beforeEach(() => {
    stubSelector(getCalibrateLocation, CALIBRATE_LOCATION_ENABLED)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a link to /calibrate when calibrate page is enabled', () => {
    const wrapper = render()
    const link = wrapper.find('a')
    const tooltip = wrapper.find(Tooltip)

    expect(tooltip.exists()).toEqual(false)
    expect(link.children().text()).toEqual('Proceed to Calibrate')
    expect(link.prop('href')).toBe('/calibrate')
  })

  it('renders a tooltip and a noop link when calibrate page is disabled', () => {
    stubSelector(getCalibrateLocation, CALIBRATE_SELECTOR_DISABLED)
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
