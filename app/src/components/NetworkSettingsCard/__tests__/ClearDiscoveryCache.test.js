// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import noop from 'lodash/noop'
import { LabeledButton } from '@opentrons/components'
import { ClearDiscoveryCache } from '../ClearDiscoveryCache'
import { clearDiscoveryCache } from '../../../discovery'

describe('ClearDiscoveryCache', () => {
  const dispatch = jest.fn()
  const MOCK_STORE = {
    dispatch,
    getState: noop,
    subscribe: noop,
  }

  const render = () => {
    return mount(<ClearDiscoveryCache />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: MOCK_STORE },
    })
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a labelled button component', () => {
    const wrapper = render()
    const theButton = wrapper.find(LabeledButton)
    expect(theButton.prop('label')).toBe('Clear Discovered Robots List')
    expect(theButton.prop('buttonProps').children).toBe('clear')
  })

  it('dispatches a ClearDiscoveryCache Action', () => {
    const wrapper = render()
    const buttonProps = wrapper.find(LabeledButton).prop('buttonProps')
    buttonProps.onClick()
    expect(dispatch).toHaveBeenCalledWith(clearDiscoveryCache())
  })
})
