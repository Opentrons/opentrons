import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { CLEAN, EMPTY } from '@opentrons/step-generation'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { TipDisposalContainer } from '../TipDisposalContainer'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof TipDisposalContainer>) => {
  return renderWithProviders(<TipDisposalContainer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('TipPickupContainer', () => {
  let props: ComponentProps<typeof TipDisposalContainer>
  beforeEach(() => {
    props = {
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
    screen.getByText('Disposal')
    screen.getByText('TRASH')
    screen.getByText('Tips in trash')
    screen.getByText('1 tips')
  })
})
