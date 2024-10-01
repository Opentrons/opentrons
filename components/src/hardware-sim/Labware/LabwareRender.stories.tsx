import type * as React from 'react'

import {
  fixture96Plate as _fixture96Plate,
  fixture24Tuberack as _fixture24Tuberack,
  fixture12Trough as _fixture12Trough,
  fixtureTiprack10ul as _fixtureTiprack10ul,
  fixtureTiprack300ul as _fixtureTiprack300ul,
  fixtureTiprack1000ul as _fixtureTiprack1000ul,
} from '@opentrons/shared-data'

import { RobotWorkSpace } from '../Deck'
import { LabwareRender } from './LabwareRender'

import type { Story, Meta } from '@storybook/react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const fixture96Plate = _fixture96Plate as LabwareDefinition2
const fixture24Tuberack = _fixture24Tuberack as LabwareDefinition2
const fixture12Trough = _fixture12Trough as LabwareDefinition2

const fixtureTiprack10 = _fixtureTiprack10ul as LabwareDefinition2
const fixtureTiprack300 = _fixtureTiprack300ul as LabwareDefinition2
const fixtureTiprack1000 = _fixtureTiprack1000ul as LabwareDefinition2

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
        viewBox={`0 0 ${fixture96Plate.dimensions.xDimension} ${fixture96Plate.dimensions.yDimension}`}
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
    defaultValue: fixture96Plate.metadata.displayName,
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
    defaultValue: fixtureTiprack10.metadata.displayName,
  },
}
TipRack.args = {
  wellLabelOption: 'SHOW_LABEL_INSIDE',
  highlightedWells: { A1: null, A2: null },
  missingTips: { C3: null, D4: null },
  highlightLabware: false,
}
