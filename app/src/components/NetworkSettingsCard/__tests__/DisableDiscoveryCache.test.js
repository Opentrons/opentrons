// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import noop from 'lodash/noop'

import * as AllConfig from '../../../config'
import { LabeledToggle } from '@opentrons/components'
import { DisableDiscoveryCache } from '../DisableDiscoveryCache'

import type { State } from '../../../types'
import type { Config } from '../../../config/types'

jest.mock('../../../config/selectors')

const MOCK_STATE: State = ({ mockState: true }: any)

const getConfig: JestMockFn<[State], Config> = AllConfig.getConfig

function stubSelector<R>(mock: JestMockFn<[State], R>, rVal: R) {
  mock.mockImplementation(state => {
    expect(state).toBe(MOCK_STATE)
    return rVal
  })
}

describe('DisableDiscoveryCache', () => {
  const dispatch = jest.fn()
  const MOCK_STORE = {
    dispatch: dispatch,
    subscribe: noop,
    getState: () => MOCK_STATE,
  }

  const render = () => {
    return mount(<DisableDiscoveryCache />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: MOCK_STORE },
    })
  }

  beforeEach(() => {
    stubSelector(getConfig, {
      discovery: {
        candidates: [],
        disableCache: false,
      },
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a labelled toggle component', () => {
    const wrapper = render()
    const theToggle = wrapper.find(LabeledToggle)
    expect(theToggle.prop('label')).toBe('Disable robot caching')
    expect(theToggle.prop('toggledOn')).toBe(false)
  })

  it('updates the toggle status according to disableCache config', () => {
    stubSelector(getConfig, {
      discovery: {
        candidates: [],
        disableCache: true,
      },
    })
    const wrapper = render()
    const theToggle = wrapper.find(LabeledToggle)
    expect(theToggle.prop('toggledOn')).toBe(true)
  })

  it('dispatches config update on toggle', () => {
    const wrapper = render()
    const theToggle = wrapper.find(LabeledToggle)
    theToggle.prop('onClick')()
    expect(dispatch).toHaveBeenCalledWith({
      type: 'config:UPDATE',
      payload: { path: 'discovery.disableCache', value: true },
      meta: { shell: true },
    })
  })
})
