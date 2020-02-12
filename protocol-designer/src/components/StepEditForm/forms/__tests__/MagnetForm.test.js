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
  })

  test('engage height caption is displayed with proper height to decimal scale', () => {
    const props = {
      focusedField: 'magnet',
      dirtyFields: [],
      onFieldFocus: jest.fn(),
      onFieldBlur: jest.fn(),
    }
    uiModuleSelectors.getMagneticLabwareOptions.mockReturnValue([
      { name: 'magnet module', value: 'magnet123', disabled: false },
    ])
    uiModuleSelectors.getMagnetLabwareEngageHeight.mockReturnValue('10.9444')

    // enzyme seems to have trouble shallow rendering with hooks and redux
    // https://github.com/airbnb/enzyme/issues/2202
    const wrapper = mount(
      <Provider store={store}>
        <MagnetForm {...props} />
      </Provider>
    )

    expect(wrapper.find(fields.TextField).prop('caption')).toEqual(
      'Recommended: 10.9'
    )
  })
})
