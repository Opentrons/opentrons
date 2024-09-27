import type * as React from 'react'
import { describe, it, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import {
  getTemperatureLabwareOptions,
  getTemperatureModuleIds,
} from '../../../../ui/modules/selectors'
import { TemperatureForm } from '../TemperatureForm'
import type * as ModulesSelectors from '../../../../ui/modules/selectors'

vi.mock('../../../../ui/modules/selectors', async importOriginal => {
  const actualFields = await importOriginal<typeof ModulesSelectors>()
  return {
    ...actualFields,
    getTemperatureLabwareOptions: vi.fn(),
    getTemperatureModuleIds: vi.fn(),
  }
})
const render = (props: React.ComponentProps<typeof TemperatureForm>) => {
  return renderWithProviders(<TemperatureForm {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TemperatureForm', () => {
  let props: React.ComponentProps<typeof TemperatureForm>

  beforeEach(() => {
    props = {
      formData: {
        id: 'formId',
        stepType: 'temperature',
        moduleId: 'mockId',
        setTemperature: true,
      } as any,
      focusHandlers: {
        blur: vi.fn(),
        focus: vi.fn(),
        dirtyFields: [],
        focusedField: null,
      },
      propsForFields: {
        moduleId: {
          onFieldFocus: vi.fn(),
          onFieldBlur: vi.fn(),
          errorToShow: null,
          disabled: false,
          name: 'setTemperature',
          updateValue: vi.fn(),
          value: 'mockId',
        },
        setTemperature: {
          onFieldFocus: vi.fn(),
          onFieldBlur: vi.fn(),
          errorToShow: null,
          disabled: false,
          name: 'setTemperature',
          updateValue: vi.fn(),
          value: true,
        },
        targetTemperature: {
          onFieldFocus: vi.fn(),
          onFieldBlur: vi.fn(),
          errorToShow: null,
          disabled: false,
          name: 'targetTemperature',
          updateValue: vi.fn(),
          value: null,
        },
      },
    }

    vi.mocked(getTemperatureModuleIds).mockReturnValue(['mockId'])
    vi.mocked(getTemperatureLabwareOptions).mockReturnValue([
      {
        name: 'mock module',
        value: 'mockId',
      },
    ])
  })

  it('renders a temperature module', () => {
    render(props)
    screen.getByText('temperature')
    screen.getByText('module')
    const change = screen.getByText('Change to temperature')
    screen.getByText('Deactivate module')
    fireEvent.click(change)
    const changeTempInput = screen.getByRole('combobox', { name: '' })
    fireEvent.change(changeTempInput, { target: { value: 40 } })
  })
})
