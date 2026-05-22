import { getAllDefinitions, getLabwareViewBox } from '@opentrons/shared-data'

import { RobotWorkSpace } from '../Deck'
import { CalibrationBlockRender } from './CalibrationBlockRender'

import type { Meta, StoryObj } from '@storybook/react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const LOAD_NAMES = [
  'opentrons_calibrationblock_short_side_left',
  'opentrons_calibrationblock_short_side_right',
]
const DEFS_BY_URI = Object.fromEntries(
  Object.entries(getAllDefinitions()).filter(([uri, def]) =>
    LOAD_NAMES.includes(def.parameters.loadName)
  )
) as Record<string, LabwareDefinition2>

// Helper function to safely get labware definition
const getLabwareDefFromArgs = (
  labwareDef: unknown
): LabwareDefinition2 | null => {
  if (typeof labwareDef === 'string' && labwareDef in DEFS_BY_URI) {
    return DEFS_BY_URI[labwareDef]
  }
  if (typeof labwareDef === 'object' && labwareDef != null) {
    return labwareDef as LabwareDefinition2
  }
  return null
}

const meta: Meta<typeof CalibrationBlockRender> = {
  title: 'Library/Molecules/Simulation/CalibrationBlockRender',
  component: CalibrationBlockRender,
  decorators: [
    (Story, context) => {
      const labwareDef = getLabwareDefFromArgs(context.args.labwareDef)

      if (labwareDef == null) {
        return <div>Invalid labware definition</div>
      }

      const { minX, minY, xDimension, yDimension } =
        getLabwareViewBox(labwareDef)
      const viewBox = `${minX} ${minY} ${xDimension} ${yDimension}`

      return (
        <RobotWorkSpace viewBox={viewBox}>{() => <Story />}</RobotWorkSpace>
      )
    },
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    labwareDef: Object.keys(DEFS_BY_URI)[0],
  },
  argTypes: {
    labwareDef: {
      options: Object.keys(DEFS_BY_URI),
      mapping: DEFS_BY_URI,
    },
  },
}
