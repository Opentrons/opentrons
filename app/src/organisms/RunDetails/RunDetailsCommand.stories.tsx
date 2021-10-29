import * as React from 'react'
import { RunDetailsCommand } from './RunDetailsCommand'

import type { Story, Meta } from '@storybook/react'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'

export default {
  title: 'App/Molecules/RunDetailsCommand',
  component: RunDetailsCommand,
} as Meta

const Template: Story<
  React.ComponentProps<typeof RunDetailsCommand>
> = args => <RunDetailsCommand {...args} />

const WELL_LOCATION = { origin: 'top', offset: { x: 0, y: 0, z: 0 } }

export const Basic = Template.bind({})
Basic.args = {
  type: 'queued',
  currentCommand: {
    commandType: 'touchTip',
    params: {
      pipetteId: 'PIPETTE_ID',
      labwareId: 'LABWARE_ID',
      wellName: 'WELL_NAME',
      wellLocation: WELL_LOCATION,
    },
    result: { volume: 10 },
  } as Command,
}
