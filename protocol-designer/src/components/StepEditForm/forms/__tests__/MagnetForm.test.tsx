import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { MAGNETIC_MODULE_V1, MAGNETIC_MODULE_V2 } from '@opentrons/shared-data'
import { selectors as uiModuleSelectors } from '../../../../ui/modules'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { FormData } from '../../../../form-types'
import * as _fields from '../../fields'
import { MagnetForm } from '../MagnetForm'

jest.mock('../../../../step-forms/selectors')
jest.mock('../../../../ui/modules')
jest.mock('../../fields')

// TODO(IL, 2021-02-01): don't any-type, follow mocking pattern in MixForm.test.js ?
const fields: any = _fields

const getUnsavedFormMock = stepFormSelectors.getUnsavedForm as jest.MockedFunction<
  typeof stepFormSelectors.getUnsavedForm
>

const getModuleEntitiesMock = stepFormSelectors.getModuleEntities as jest.MockedFunction<
  typeof stepFormSelectors.getModuleEntities
>

const getMagnetLabwareEngageHeightMock = uiModuleSelectors.getMagnetLabwareEngageHeight as jest.MockedFunction<
  typeof uiModuleSelectors.getMagnetLabwareEngageHeight
>

describe('MagnetForm', () => {
  let store: any
  let props: React.ComponentProps<typeof MagnetForm>
  function render(_props: React.ComponentProps<typeof MagnetForm>) {
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
        moduleId: 'magnetV1',
        magnetAction: 'engage',
      } as any,
      focusHandlers: {
        blur: jest.fn(),
        focus: jest.fn(),
        dirtyFields: [],
        focusedField: null,
      },
      propsForFields: {
        magnetAction: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'magnetAction',
          updateValue: jest.fn() as any,
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
    fields.TextField = jest.fn().mockImplementation(() => <div />)
    fields.RadioGroupField = jest.fn().mockImplementation(() => <div />)
    ;(uiModuleSelectors.getMagneticLabwareOptions as jest.MockedFunction<
      typeof uiModuleSelectors.getMagneticLabwareOptions
    >).mockReturnValue([
      { name: 'magnet module v1', value: 'magnetV1', disabled: false },
      { name: 'magnet module v2', value: 'magnetV2', disabled: false },
    ])

    getUnsavedFormMock.mockReturnValue({ stepType: 'magnet' } as FormData)

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
    getMagnetLabwareEngageHeightMock.mockReturnValue(10.9444)

    const wrapper = render(props)

    expect(wrapper.find(fields.TextField).prop('caption')).toEqual(
      'Recommended: 10.9'
    )
  })

  it('engage height caption is null when no engage height', () => {
    getMagnetLabwareEngageHeightMock.mockReturnValue(null)

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
