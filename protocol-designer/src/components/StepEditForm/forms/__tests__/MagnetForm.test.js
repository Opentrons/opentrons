import { MAGNETIC_MODULE_V1, MAGNETIC_MODULE_V2 } from '@opentrons/shared-data'
import { mount } from 'enzyme'
import React from 'react'
import { Provider } from 'react-redux'

import { selectors as uiModuleSelectors } from '../../../../ui/modules'
import * as fields from '../../fields'
import { MagnetForm } from '../MagnetForm'

jest.mock('../../../../ui/modules')
jest.mock('../../fields')

describe('MagnetForm', () => {
  let store
  let props
  function render(props) {
    // enzyme seems to have trouble shallow rendering with hooks and redux
    // https://github.com/airbnb/enzyme/issues/2202
    return mount(
      <Provider store={store}>
        <MagnetForm {...props} />
      </Provider>
    )
  }

  beforeEach(() => {
    props = {
      formData: {
        meta: { module: { model: MAGNETIC_MODULE_V1 } },
      },
      focusHandlers: {
        focusedField: 'magnet',
        dirtyFields: [],
        onFieldFocus: jest.fn(),
        onFieldBlur: jest.fn(),
      },
    }
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

    const wrapper = render(props)

    expect(wrapper.find(fields.TextField).prop('caption')).toEqual(
      'Recommended: 10.9'
    )
  })

  it('engage height caption is null when no engage height', () => {
    uiModuleSelectors.getMagnetLabwareEngageHeight.mockReturnValue(null)

    const wrapper = render(props)

    expect(wrapper.find(fields.TextField).prop('caption')).toBeNull()
  })

  const models = [
    { modelNum: '1', model: MAGNETIC_MODULE_V1 },
    { modelNum: '2', model: MAGNETIC_MODULE_V2 },
  ]
  models.forEach(({ modelNum, model }) => {
    it(`should show appropriate engage height image for ${model}`, () => {
      const wrapper = render({
        ...props,
        formData: {
          meta: { module: { model } },
        },
      })
      expect(
        wrapper
          .find('.engage_height_diagram')
          .hasClass(`engage_height_diagram_gen${modelNum}`)
      ).toBe(true)
    })
  })
})
