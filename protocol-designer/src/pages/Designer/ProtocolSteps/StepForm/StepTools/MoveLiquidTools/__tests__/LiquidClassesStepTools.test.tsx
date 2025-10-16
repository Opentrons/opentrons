import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { WATER_LIQUID_CLASS_NAME } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { getLiquidEntities } from '/protocol-designer/step-forms/selectors'

import { LiquidClassesStepTools } from '../LiquidClassesStepTools'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/step-forms/selectors')

const render = (props: ComponentProps<typeof LiquidClassesStepTools>) => {
  return renderWithProviders(<LiquidClassesStepTools {...props} />, {
    i18nInstance: i18n,
  })
}

describe('LiquidClassesStepMoveLiquidTools', () => {
  let props: ComponentProps<typeof LiquidClassesStepTools>

  beforeEach(() => {
    props = {
      propsForFields: {
        liquidClass: {
          onFieldFocus: vi.fn(),
          onFieldBlur: vi.fn(),
          errorToShow: null,
          disabled: false,
          name: 'liquidClass',
          updateValue: vi.fn(),
          value: null,
        },
      },
      formData: { liquidClass: 'none' } as any,
      orderedLiquidClassOptions: [
        {
          name: 'mockname',
          value: WATER_LIQUID_CLASS_NAME,
          subButtonLabel: '',
        },
      ],
      type: 'transfer',
    }
    vi.mocked(getLiquidEntities).mockReturnValue({})
  })

  it('renders subtext for mix when mix is true', () => {
    props.type = 'mix'
    render(props)
    screen.getByText('Apply liquid class settings for this mix')
  })
})
