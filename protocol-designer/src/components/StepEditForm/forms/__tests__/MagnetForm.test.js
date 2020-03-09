import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { selectors as uiModuleSelectors } from '../../../../ui/modules'
import * as fields from '../../fields'
import { MagnetForm } from '../MagnetForm'

jest.mock('../../../../ui/modules')
jest.mock('../../fields')

describe('MagnetForm', () => {
  let store
  function render() {
    const props = {
      focusHandlers: {
        focusedField: 'magnet',
        dirtyFields: [],
        onFieldFocus: jest.fn(),
        onFieldBlur: jest.fn(),
      },
    }
    // enzyme seems to have trouble shallow rendering with hooks and redux
    // https://github.com/airbnb/enzyme/issues/2202
    return mount(
      <Provider store={store}>
        <MagnetForm {...props} />
      </Provider>
    )
  }

  beforeEach(() => {
    store = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }

    fields.ConditionalOnField = jest
      .fn()
      .mockImplementation(props => <div>{props.children}</div>)
    fields.TextField = jest.fn().mockImplementation(props => <div />)
    fields.RadioGroupField = jest.fn().mockImplementation(props => <div />)

    uiModuleSelectors.getMagneticLabwareOptions.mockReturnValue([
      { name: 'magnet module', value: 'magnet123', disabled: false },
    ])
  })

  it('engage height caption is displayed with proper height to decimal scale', () => {
    uiModuleSelectors.getMagnetLabwareEngageHeight.mockReturnValue('10.9444')

    const wrapper = render()

    expect(wrapper.find(fields.TextField).prop('caption')).toEqual(
      'Recommended: 10.9'
    )
  })

  it('engage height caption is null when no engage height', () => {
    uiModuleSelectors.getMagnetLabwareEngageHeight.mockReturnValue(null)

    const wrapper = render()

    expect(wrapper.find(fields.TextField).prop('caption')).toBeNull()
  })
})
