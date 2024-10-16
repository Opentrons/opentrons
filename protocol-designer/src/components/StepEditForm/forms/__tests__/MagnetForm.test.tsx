import type * as React from 'react'
import { describe, it, afterEach, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { getMagneticLabwareOptions } from '../../../../ui/modules/selectors'
import { getModuleEntities } from '../../../../step-forms/selectors'
import { getMagnetLabwareEngageHeight } from '../../../../ui/modules/utils'
import { MagnetForm } from '../MagnetForm'

vi.mock('../../../../ui/modules/utils')
vi.mock('../../../../ui/modules/selectors')
vi.mock('../../../../step-forms/selectors')
const render = (props: React.ComponentProps<typeof MagnetForm>) => {
  return renderWithProviders(<MagnetForm {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('MagnetForm', () => {
  let props: React.ComponentProps<typeof MagnetForm>

  beforeEach(() => {
    props = {
      formData: {
        id: 'magnet',
        stepType: 'magnet',
        moduleId: 'magnetId',
        magnetAction: 'engage',
      } as any,
      focusHandlers: {
        blur: vi.fn(),
        focus: vi.fn(),
        dirtyFields: [],
        focusedField: null,
      },
      propsForFields: {
        magnetAction: {
          onFieldFocus: vi.fn(),
          onFieldBlur: vi.fn(),
          errorToShow: null,
          disabled: false,
          name: 'magnetAction',
          updateValue: vi.fn(),
          value: 'engage',
        },
        engageHeight: {
          onFieldFocus: vi.fn(),
          onFieldBlur: vi.fn(),
          errorToShow: null,
          disabled: false,
          name: 'engage height',
          updateValue: vi.fn(),
          value: 10,
        },
      },
    }
    vi.mocked(getMagneticLabwareOptions).mockReturnValue([
      { name: 'mock name', value: 'mockValue' },
    ])
    vi.mocked(getModuleEntities).mockReturnValue({
      magnetId: {
        id: 'magnetId',
        model: 'magneticModuleV2',
        type: 'magneticModuleType',
      },
    })
    vi.mocked(getMagnetLabwareEngageHeight).mockReturnValue(null)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('renders the text and radio buttons for v2', () => {
    render(props)
    screen.getByText('magnet')
    screen.getByText('module')
    screen.getByText('mock name')
    screen.getByText('Magnet state')
    const engage = screen.getByText('Engage')
    screen.getByText('Disengage')
    fireEvent.click(engage)
    screen.getByText('Must be between -2.5 to 25.')
  })
  it('renders the input text for v1', () => {
    vi.mocked(getModuleEntities).mockReturnValue({
      magnetId: {
        id: 'magnetId',
        model: 'magneticModuleV1',
        type: 'magneticModuleType',
      },
    })
    render(props)
    screen.getByText('Must be between 0 to 45.')
  })
})
