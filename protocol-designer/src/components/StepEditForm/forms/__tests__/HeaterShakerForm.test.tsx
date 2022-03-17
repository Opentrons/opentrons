import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  DropdownOption,
  renderWithProviders,
  partialComponentPropsMatcher,
} from '@opentrons/components'
import { getHeaterShakerLabwareOptions } from '../../../../ui/modules/selectors'
import { i18n } from '../../../../localization'
import { StepFormDropdown } from '../../fields'
import { HeaterShakerForm } from '../HeaterShakerForm'

jest.mock('../../../../ui/modules/selectors')
jest.mock('../../fields')

const mockGetHeaterShakerLabwareOptions = getHeaterShakerLabwareOptions as jest.MockedFunction<
  typeof getHeaterShakerLabwareOptions
>
const mockStepFormDropdown = StepFormDropdown as jest.MockedFunction<
  typeof StepFormDropdown
>

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
        magnetAction: {
          onFieldFocus: jest.fn() as any,
          onFieldBlur: jest.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'heaterShakerAction',
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
    mockStepFormDropdown.mockImplementation(() => <div></div>)
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
})
