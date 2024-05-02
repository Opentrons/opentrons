import * as React from 'react'
import { DeckLocationSelect as DeckLocationSelectComponent } from './'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import type { Meta, StoryObj } from '@storybook/react'
import type { RobotType } from '@opentrons/shared-data'

const meta: Meta<React.ComponentProps<typeof DeckLocationSelectComponent>> = {
  component: DeckLocationSelectComponent,
  title: 'Library/Molecules/Simulation/SelectDeckLocation',
} as Meta

export default meta
type Story = StoryObj<{ disabledSlotNames: string[]; robotType: RobotType }>

export const FlexDeckLocationSelect: Story = {
  render: args => {
    return <Wrapper {...args} />
  },
  args: {
    disabledSlotNames: ['A2'],
    robotType: FLEX_ROBOT_TYPE,
  },
}

export const OT2DeckLocationSelect: Story = {
  render: args => {
    return <Wrapper {...args} />
  },
  args: {
    disabledSlotNames: ['2'],
    robotType: OT2_ROBOT_TYPE,
  },
}

function Wrapper(props: {
  disabledSlotNames: string[]
  robotType: RobotType
}): JSX.Element {
  const [selectedLocation, setSelectedLocation] = React.useState({
    slotName: props.robotType === FLEX_ROBOT_TYPE ? 'A1' : '1',
  })

  const deckDef = getDeckDefFromRobotType(props.robotType)
  return (
    <DeckLocationSelectComponent
      {...{ selectedLocation, setSelectedLocation, deckDef }}
      disabledLocations={props.disabledSlotNames.map(s => ({ slotName: s }))}
    />
  )
}
