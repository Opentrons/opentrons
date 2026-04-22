import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'
import { CLEAN, EMPTY } from '@opentrons/step-generation'

import { TipPickupContainer } from '..'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const render = (props: ComponentProps<typeof TipPickupContainer>) => {
  return renderWithProviders(<TipPickupContainer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('TipPickupContainer', () => {
  let props: ComponentProps<typeof TipPickupContainer>
  beforeEach(() => {
    props = {
      tiprackEntity: {
        id: 'mockId',
        pythonName: 'mockName',
        def: fixture96Plate as LabwareDefinition2,
        labwareDefURI: 'mockURI',
      },
      robotState: {
        pipettes: {},
        modules: {},
        tipState: {
          tipracks: { mockId: { A1: CLEAN, A2: EMPTY } },
          pipettes: {},
        },
        labware: { mockId: { stack: ['mockId', 'A1'] } },
        liquidState: {} as any,
      },
    }
  })
  it('render text', () => {
    render(props)
    screen.getByText('Tip pickup')
    screen.getByText('A1')
    screen.getByText('ANSI 96 Standard Microplate')
    screen.getByText('Tips remaining')
    screen.getByText('1 tips')
  })
})
