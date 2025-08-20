import * as React from 'react'

import { fixture96Plate } from '@opentrons/shared-data'

import { LabwareButtonBasket as LabwareButtonBasketComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const meta: Meta<typeof LabwareButtonBasketComponent> = {
  title: 'Protocol-Designer/Molecules/LabwareButtonBasket',
  component: LabwareButtonBasketComponent,
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof LabwareButtonBasketComponent>

export const LabwareButtonBasket: Story = (
  args: ComponentProps<typeof LabwareButtonBasketComponent>
) => {
  return <LabwareButtonBasketComponent {...args} />
}

LabwareButtonBasket.args = {
  stackOfLabware: ['labware1', 'labware2', 'labware3'],
  selectedLabware: 'labware3',
  labware: {
    labware1: {
      def: {
        ...fixture96Plate,
        metadata: { displayName: 'Thermocycler lid' } as any,
      } as LabwareDefinition2,
    } as any,
    labware2: { def: fixture96Plate as LabwareDefinition2 } as any,
    labware3: { def: fixture96Plate as LabwareDefinition2 } as any,
  },
  setSelectedLabware: () => {},
}
