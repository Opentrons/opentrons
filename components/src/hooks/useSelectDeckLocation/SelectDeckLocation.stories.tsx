import * as React from 'react'
import { DeckLocationSelect as DeckLocationSelectComponent } from './'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<React.ComponentProps<typeof DeckLocationSelectComponent>> = {
  component: DeckLocationSelectComponent,
  title: 'Library/Molecules/Simulation/SelectDeckLocation',
} as Meta

export default meta
type Story = StoryObj<{ disabledSlotNames: string[] }>

export const DeckLocationSelect: Story = {
  render: args => {
    return <Wrapper {...args} />
  },
  args: {
    disabledSlotNames: ['A2'],
  },
}

function Wrapper(props: { disabledSlotNames: string[] }): JSX.Element {
  const [selectedLocation, setSelectedLocation] = React.useState({
    slotName: 'A1',
  })

  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  return (
    <DeckLocationSelectComponent
      {...{ selectedLocation, setSelectedLocation, deckDef }}
      disabledLocations={props.disabledSlotNames.map(s => ({ slotName: s }))}
    />
  )
}
