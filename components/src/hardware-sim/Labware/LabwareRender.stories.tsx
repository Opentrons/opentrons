import * as React from 'react'

import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_24_tuberack from '@opentrons/shared-data/labware/fixtures/2/fixture_24_tuberack.json'
import fixture_12_trough from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import fixture_tiprack_1000_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_1000_ul.json'

import { RobotWorkSpace } from '../Deck'
import { LabwareRender } from './LabwareRender'

import type { Story, Meta } from '@storybook/react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const fixture96Plate = fixture_96_plate as LabwareDefinition2
const fixture24Tuberack = fixture_24_tuberack as LabwareDefinition2
const fixture12Trough = fixture_12_trough as LabwareDefinition2

const fixtureTiprack10 = fixture_tiprack_10_ul as LabwareDefinition2
const fixtureTiprack300 = fixture_tiprack_300_ul as LabwareDefinition2
const fixtureTiprack1000 = fixture_tiprack_1000_ul as LabwareDefinition2

const labwareDefMap: Record<string, LabwareDefinition2> = {
  [fixture96Plate.metadata.displayName]: fixture96Plate,
  [fixture24Tuberack.metadata.displayName]: fixture24Tuberack,
  [fixture12Trough.metadata.displayName]: fixture12Trough,
}

const tipRackDefMap: Record<string, LabwareDefinition2> = {
  [fixtureTiprack10.metadata.displayName]: fixtureTiprack10,
  [fixtureTiprack300.metadata.displayName]: fixtureTiprack300,
  [fixtureTiprack1000.metadata.displayName]: fixtureTiprack1000,
}

export default {
  title: 'Library/Molecules/Simulation/Labware',
  decorators: [
    Story => (
      <RobotWorkSpace
        viewBox={`0 0 ${fixture_96_plate.dimensions.xDimension} ${fixture_96_plate.dimensions.yDimension}`}
      >
        {() => <Story />}
      </RobotWorkSpace>
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
  wellLabelOption: 'SHOW_LABEL_INSIDE',
  highlightedWells: { A1: null, A2: null },
  wellFill: { A1: 'maroon', A2: 'lavender' },
  highlightLabware: false,
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
  wellLabelOption: 'SHOW_LABEL_INSIDE',
  highlightedWells: { A1: null, A2: null },
  missingTips: { C3: null, D4: null },
  highlightLabware: false,
}
