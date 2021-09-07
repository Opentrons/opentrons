import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import noop from 'lodash/noop'

import * as Cfg from '../../../../redux/config'
import { LabeledToggle } from '@opentrons/components'
import { DisableDiscoveryCache } from '../DisableDiscoveryCache'

import type { State } from '../../../../redux/types'

jest.mock('../../../../redux/config/selectors')

const MOCK_STATE: State = { mockState: true } as any

const getConfig = Cfg.getConfig as jest.MockedFunction<typeof Cfg.getConfig>

function stubSelector<R>(
  mock: jest.MockedFunction<(s: State) => R>,
  rVal: R
): void {
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

  const render = (): ReturnType<typeof mount> => {
    return mount(<DisableDiscoveryCache />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: MOCK_STORE },
    })
  }

  beforeEach(() => {
    stubSelector(getConfig, {
      discovery: { candidates: [], disableCache: false },
    } as any)
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

  it('renders description of the toggle component', () => {
    const wrapper = render()
    expect(wrapper.children().html()).toMatch(
      /Disable caching of previously seen robots./
    )
  })

  it('updates the toggle status according to disableCache config', () => {
    stubSelector(getConfig, {
      discovery: { candidates: [], disableCache: true },
    } as any)
    const wrapper = render()
    expect(wrapper.find(LabeledToggle).prop('toggledOn')).toBe(true)

    // toggle switches value
    stubSelector(getConfig, {
      discovery: { candidates: [], disableCache: false },
    } as any)

    // trigger a re-render
    wrapper.setProps({})
    expect(wrapper.find(LabeledToggle).prop('toggledOn')).toBe(false)
  })

  it('dispatches config toggle on toggle', () => {
    const wrapper = render()
    const theToggle = wrapper.find(LabeledToggle)
    theToggle.prop('onClick')()
    expect(dispatch).toHaveBeenCalledWith(
      Cfg.toggleConfigValue('discovery.disableCache')
    )
  })
})
