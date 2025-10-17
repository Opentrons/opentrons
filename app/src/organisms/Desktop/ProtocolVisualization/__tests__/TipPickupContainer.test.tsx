import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { fixture96Plate, LabwareDefinition2 } from '@opentrons/shared-data'
import { CLEAN, EMPTY } from '@opentrons/step-generation'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { TipPickupContainer } from '../TipPickupContainer'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof TipPickupContainer>) => {
  return renderWithProviders(<TipPickupContainer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('TipPickupContainer', () => {
  let props: ComponentProps<typeof TipPickupContainer>
  beforeEach(() => {
    props = {
      protocolKey: 'mockProtocolKey',
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
