import * as React from 'react'

import { RobotWorkSpace } from './RobotWorkSpace'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate'
import fixture_24_tuberack from '@opentrons/shared-data/labware/fixtures/2/fixture_24_tuberack'
import fixture_12_trough from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul'
import fixture_tiprack_1000_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_1000_ul'

import { LabwareRender } from './LabwareRender'

import type { Story, Meta } from '@storybook/react'

const labwareDefMap: Record<string, typeof fixture_96_plate> = {
  [fixture_96_plate.metadata.displayName]: fixture_96_plate,
  [fixture_24_tuberack.metadata.displayName]: fixture_24_tuberack,
  [fixture_12_trough.metadata.displayName]: fixture_12_trough,
}
const tipRackDefMap: Record<string, typeof fixture_96_plate> = {
  [fixture_tiprack_10_ul.metadata.displayName]: fixture_tiprack_10_ul,
  [fixture_tiprack_300_ul.metadata.displayName]: fixture_tiprack_300_ul,
  [fixture_tiprack_1000_ul.metadata.displayName]: fixture_tiprack_1000_ul,
}
export default {
  title: 'Library/Molecules/Simulation/Labware',
  decorators: [
    Story => (
      <RobotWorkSpace
        viewBox={`0 0 ${fixture_96_plate.dimensions.xDimension} ${fixture_96_plate.dimensions.yDimension}`}
        children={() => <Story />}
      />
    ),
  ],
} as Meta

const Template: Story<React.ComponentProps<typeof LabwareRender>> = ({
  definition,
  ...args
}) => {
  const displayName: unknown = definition
  const allLabwareMap = { ...labwareDefMap, ...tipRackDefMap }
  const resolvedDef: typeof definition = allLabwareMap[displayName as string]
  return <LabwareRender definition={resolvedDef} {...args} />
}
export const Basic = Template.bind({})
Basic.argTypes = {
  definition: {
    control: {
      type: 'select',
      options: Object.keys(labwareDefMap).map(
        d => labwareDefMap[d].metadata.displayName
      ),
    },
    defaultValue: fixture_96_plate.metadata.displayName,
  },
}
Basic.args = {
  showLabels: true,
  highlightedWells: { A1: null, A2: null },
  wellFill: { A1: 'maroon', A2: 'lavender' },
}

export const TipRack = Template.bind({})
TipRack.argTypes = {
  definition: {
    control: {
      type: 'select',
      options: Object.keys(tipRackDefMap).map(
        d => tipRackDefMap[d].metadata.displayName
      ),
    },
    defaultValue: fixture_tiprack_10_ul.metadata.displayName,
  },
}
TipRack.args = {
  showLabels: true,
  highlightedWells: { A1: null, A2: null },
  missingTips: { C3: null, D4: null },
}
