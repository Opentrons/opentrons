import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { WATER_LIQUID_CLASS_NAME } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../../../../__testing-utils__'
import { i18n } from '../../../../../../../assets/localization'
import { getLiquidEntities } from '../../../../../../../step-forms/selectors'
import { LiquidClassesStepTools } from '../LiquidClassesStepTools'

import type { ComponentProps } from 'react'

vi.mock('../../../../../../../step-forms/selectors')

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
