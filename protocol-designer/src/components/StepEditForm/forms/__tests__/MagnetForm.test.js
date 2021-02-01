// @flow
import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { MAGNETIC_MODULE_V1, MAGNETIC_MODULE_V2 } from '@opentrons/shared-data'
import { selectors as uiModuleSelectors } from '../../../../ui/modules'
import * as stepFormSelectors from '../../../../step-forms/selectors'
import * as _fields from '../../fields'
import { MagnetForm, type MagnetFormProps } from '../MagnetForm'
import type { Options } from '@opentrons/components'
import type { BaseState } from '../../../../types'

// TODO(IL, 2021-02-01): don't any-type, follow mocking pattern in MixForm.test.js ?
const fields: any = _fields

jest.mock('../../../../step-forms/selectors')

const getUnsavedFormMock: JestMockFn<[BaseState], any> =
  stepFormSelectors.getUnsavedForm

jest.mock('../../../../ui/modules')
jest.mock('../../fields')

describe('MagnetForm', () => {
  let store
  let props: MagnetFormProps
  function render(_props: MagnetFormProps) {
    // enzyme seems to have trouble shallow rendering with hooks and redux
    // https://github.com/airbnb/enzyme/issues/2202
    return mount(
      <Provider store={store}>
        <MagnetForm {..._props} />
      </Provider>
    )
  }

  beforeEach(() => {
    props = {
      formData: {
        id: 'formId',
        stepType: 'magnet',
        meta: { module: { model: MAGNETIC_MODULE_V1 } },
      },
      focusHandlers: {
        blur: jest.fn(),
        focus: jest.fn(),
        dirtyFields: [],
        focusedField: null,
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
    ;(uiModuleSelectors.getMagneticLabwareOptions: JestMockFn<
      [BaseState],
      Options
    >).mockReturnValue([
      { name: 'magnet module', value: 'magnet123', disabled: false },
    ])

    getUnsavedFormMock.mockReturnValue({ stepType: 'magnet' })
  })

  it('engage height caption is displayed with proper height to decimal scale', () => {
    ;(uiModuleSelectors.getMagnetLabwareEngageHeight: JestMockFn<
      [BaseState],
      number | null
    >).mockReturnValue(10.9444)

    const wrapper = render(props)

    expect(wrapper.find(fields.TextField).prop('caption')).toEqual(
      'Recommended: 10.9'
    )
  })

  it('engage height caption is null when no engage height', () => {
    ;(uiModuleSelectors.getMagnetLabwareEngageHeight: JestMockFn<
      [BaseState],
      number | null
    >).mockReturnValue(null)

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
          ...props.formData,
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
