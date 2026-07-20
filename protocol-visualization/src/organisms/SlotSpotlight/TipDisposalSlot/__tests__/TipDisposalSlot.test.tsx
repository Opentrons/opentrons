import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { CLEAN, EMPTY } from '@opentrons/step-generation'

import { TipDisposalSlot } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof TipDisposalSlot>) => {
  return renderWithProviders(<TipDisposalSlot {...props} />, {
    i18nInstance: i18n,
  })
}

describe('TipDisposalSlot', () => {
  let props: ComponentProps<typeof TipDisposalSlot>
  beforeEach(() => {
    props = {
      disposalType: 'trash',
      robotState: {
        labware: {},
        liquidState: {} as any,
        pipettes: {},
        modules: {},
        tipState: {
          tipracks: { mockId: { A1: CLEAN, A2: EMPTY } },
          pipettes: {},
        },
      },
    }
  })
  it('render text', () => {
    render(props)
    screen.getByText('TRASH')
    // screen.getByText('Tips in trash')
    // screen.getByText('1 tips')
  })
})
