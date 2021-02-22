// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { MAGNETIC_MODULE_V1, MAGNETIC_MODULE_V2 } from '@opentrons/shared-data'
import { selectors as uiModuleSelectors } from '../../../../ui/modules'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import * as _fields from '../../fields'
import { MagnetForm } from '../MagnetForm'
import type { Options } from '@opentrons/components'
import type { BaseState } from '../../../../types'
import type { ModuleEntities } from '../../../../step-forms/types'

jest.mock('../../../../step-forms/selectors')
jest.mock('../../../../ui/modules')
jest.mock('../../fields')

// TODO(IL, 2021-02-01): don't any-type, follow mocking pattern in MixForm.test.js ?
const fields: any = _fields

const getUnsavedFormMock: JestMockFn<[BaseState], any> =
  stepFormSelectors.getUnsavedForm

const getModuleEntitiesMock: JestMockFn<[BaseState], ModuleEntities> =
  stepFormSelectors.getModuleEntities

describe('MagnetForm', () => {
  let store
  let props: React.ElementProps<typeof MagnetForm>
  function render(_props: React.ElementProps<typeof MagnetForm>) {
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
      formData: ({
        id: 'formId',
        stepType: 'magnet',
        moduleId: 'magnetV1',
        magnetAction: 'engage',
      }: any),
      focusHandlers: {
        blur: jest.fn(),
        focus: jest.fn(),
        dirtyFields: [],
        focusedField: null,
      },
      propsForFields: {
        magnetAction: {
          onFieldFocus: (jest.fn(): any),
          onFieldBlur: (jest.fn(): any),
          errorToShow: null,
          disabled: false,
          name: 'magnetAction',
          updateValue: (jest.fn(): any),
          value: null,
        },
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
      { name: 'magnet module v1', value: 'magnetV1', disabled: false },
      { name: 'magnet module v2', value: 'magnetV2', disabled: false },
    ])

    getUnsavedFormMock.mockReturnValue({ stepType: 'magnet' })

    getModuleEntitiesMock.mockReturnValue({
      magnetV1: {
        id: 'magnetV1',
        type: 'magneticModuleType',
        model: 'magneticModuleV1',
      },
      magnetV2: {
        id: 'magnetV2',
        type: 'magneticModuleType',
        model: 'magneticModuleV2',
      },
    })
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
          moduleId: `magnetV${modelNum}`,
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
