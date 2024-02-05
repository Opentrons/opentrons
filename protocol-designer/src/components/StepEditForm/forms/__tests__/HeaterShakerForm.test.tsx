import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders, partialComponentPropsMatcher  } from '../../../../__testing-utils__'
import { getHeaterShakerLabwareOptions } from '../../../../ui/modules/selectors'
import { i18n } from '../../../../localization'
import { StepFormDropdown, TextField, ToggleRowField } from '../../fields'
import { HeaterShakerForm } from '../HeaterShakerForm'
import type { DropdownOption } from '@opentrons/components'

jest.mock('../../../../ui/modules/selectors')
jest.mock('../../fields/', () => {
  const actualFields = jest.requireActual('../../fields')

  return {
    ...actualFields,
    StepFormDropdown: jest.fn(() => <div></div>),
    TextField: jest.fn(() => <div></div>),
    ToggleRowField: jest.fn(() => <div></div>),
  }
})

const mockGetHeaterShakerLabwareOptions = getHeaterShakerLabwareOptions as jest.MockedFunction<
  typeof getHeaterShakerLabwareOptions
>
const mockStepFormDropdown = StepFormDropdown as jest.MockedFunction<
  typeof StepFormDropdown
>
const mockToggleRowField = ToggleRowField as jest.MockedFunction<
  typeof ToggleRowField
>
const mockTextField = TextField as jest.MockedFunction<typeof TextField>

const render = (props: React.ComponentProps<typeof HeaterShakerForm>) => {
  return renderWithProviders(<HeaterShakerForm {...props} />, {
    i18nInstance: i18n as any,
  })[0]
}

describe('HeaterShakerForm', () => {
  let mockDropdownOptions: DropdownOption[]
  let props: React.ComponentProps<typeof HeaterShakerForm>
  beforeEach(() => {
    props = {
      formData: {
        id: 'formId',
        stepType: 'heaterShaker',
        moduleId: 'heaterShakerV1',
      } as any,
      focusHandlers: {
        blur: jest.fn(),
        focus: jest.fn(),
        dirtyFields: [],
        focusedField: null,
      },
      propsForFields: {
        setHeaterShakerTemperature: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'setHeaterShakerTemperature',
          updateValue: jest.fn() as any,
          value: null,
        },
        setShake: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'setShake',
          updateValue: jest.fn() as any,
          value: null,
        },
        latchOpen: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'latchOpen',
          updateValue: jest.fn() as any,
          value: null,
        },
        targetSpeed: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'targetSpeed',
          updateValue: jest.fn() as any,
          value: null,
        },
        targetHeaterShakerTemperature: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'targetHeaterShakerTemperature',
          updateValue: jest.fn() as any,
          value: null,
        },
      },
    }
    mockDropdownOptions = [
      {
        name: 'module',
        value: 'some module',
      },
    ]
    mockGetHeaterShakerLabwareOptions.mockImplementation(
      () => mockDropdownOptions
    )
  })
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should render a title', () => {
    const { getByText } = render(props)
    getByText(/heater-shaker/i)
  })
  it('should render a module dropdown field', () => {
    when(mockStepFormDropdown)
      .calledWith(
        partialComponentPropsMatcher({
          options: mockDropdownOptions,
        })
      )
      .mockReturnValue(<div>mock step form dropdown field!</div>)
    const { getByText } = render(props)
    getByText('mock step form dropdown field!')
  })
  it('should render a set temperature toggle', () => {
    when(mockToggleRowField)
      .calledWith(
        partialComponentPropsMatcher({
          name: 'setHeaterShakerTemperature',
        })
      )
      .mockReturnValue(<div>mock set temp toggle!</div>)
    const { getByText } = render(props)
    getByText('mock set temp toggle!')
  })
  it('should render a temperature input when the temperature toggle is ON', () => {
    props.formData = {
      ...props.formData,
      setHeaterShakerTemperature: true,
    }
    when(mockTextField)
      .calledWith(
        partialComponentPropsMatcher({
          name: 'targetHeaterShakerTemperature',
        })
      )
      .mockReturnValue(<div>mock temp input!</div>)
    const { getByText } = render(props)
    getByText('mock temp input!')
  })
  it('should render a set shake toggle', () => {
    when(mockToggleRowField)
      .calledWith(
        partialComponentPropsMatcher({
          name: 'setShake',
        })
      )
      .mockReturnValue(<div>mock set shake toggle!</div>)
    const { getByText } = render(props)
    getByText('mock set shake toggle!')
  })
  it('should render a RPM input when the set shake toggle is ON', () => {
    props.formData = {
      ...props.formData,
      setShake: true,
    }
    when(mockTextField)
      .calledWith(
        partialComponentPropsMatcher({
          name: 'targetSpeed',
        })
      )
      .mockReturnValue(<div>mock RPM input!</div>)
    const { getByText } = render(props)
    getByText('mock RPM input!')
  })
  it('should render a set latch toggle', () => {
    when(mockToggleRowField)
      .calledWith(
        partialComponentPropsMatcher({
          name: 'latchOpen',
        })
      )
      .mockReturnValue(<div>mock set latch toggle!</div>)
    const { getByText } = render(props)
    getByText('mock set latch toggle!')
  })
})
