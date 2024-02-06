import * as React from 'react'
import { describe, it, beforeEach, afterEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { getHeaterShakerLabwareOptions } from '../../../../ui/modules/selectors'
import { i18n } from '../../../../localization'
import { HeaterShakerForm } from '../HeaterShakerForm'
import type { DropdownOption } from '@opentrons/components'

vi.mock('../../../../ui/modules/selectors')
vi.mock('../../fields', async () => {
  const actualFields = await vi.importActual('../../fields')

  return {
    ...actualFields,
    StepFormDropdown: vi.fn(() => <div>mock step form dropdown field!</div>),
    TextField: vi.fn(({children}: {children: React.ReactNode}) => <div>mock {children} input!</div>),
    ToggleRowField: vi.fn(({children}: {children: React.ReactNode}) => <div>mock {children} toggle!</div>),
  }
})

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
        blur: vi.fn(),
        focus: vi.fn(),
        dirtyFields: [],
        focusedField: null,
      },
      propsForFields: {
        setHeaterShakerTemperature: {
          onFieldFocus: vi.fn() as any,
          onFieldBlur: vi.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'setHeaterShakerTemperature',
          updateValue: vi.fn() as any,
          value: null,
        },
        setShake: {
          onFieldFocus: vi.fn() as any,
          onFieldBlur: vi.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'setShake',
          updateValue: vi.fn() as any,
          value: null,
        },
        latchOpen: {
          onFieldFocus: vi.fn() as any,
          onFieldBlur: vi.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'latchOpen',
          updateValue: vi.fn() as any,
          value: null,
        },
        targetSpeed: {
          onFieldFocus: vi.fn() as any,
          onFieldBlur: vi.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'targetSpeed',
          updateValue: vi.fn() as any,
          value: null,
        },
        targetHeaterShakerTemperature: {
          onFieldFocus: vi.fn() as any,
          onFieldBlur: vi.fn() as any,
          errorToShow: null,
          disabled: false,
          name: 'targetHeaterShakerTemperature',
          updateValue: vi.fn() as any,
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
    vi.mocked(getHeaterShakerLabwareOptions).mockImplementation(
      () => mockDropdownOptions
    )
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should render a title', () => {
    render(props)
    screen.getByText(/heater-shaker/i)
  })
  it('should render a module dropdown field', () => {
    render(props)
    screen.getByText('mock step form dropdown field!')
  })
  it('should render a set temperature toggle', () => {
    render(props)
    screen.getByText('mock set temp toggle!')
  })
  it('should render a temperature input when the temperature toggle is ON', () => {
    props.formData = {
      ...props.formData,
      setHeaterShakerTemperature: true,
    }
   
    render(props)
    screen.getByText('mock temp input!')
  })
  it('should render a set shake toggle', () => {
    render(props)
    screen.getByText('mock set shake toggle!')
  })
  it('should render a RPM input when the set shake toggle is ON', () => {
    props.formData = {
      ...props.formData,
      setShake: true,
    }
    
    render(props)
    screen.getByText('mock RPM input!')
  })
  it('should render a set latch toggle', () => {
    render(props)
    screen.getByText('mock set latch toggle!')
  })
})
