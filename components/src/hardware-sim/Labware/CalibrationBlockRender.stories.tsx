import { getAllDefinitions, getLabwareViewBox } from '@opentrons/shared-data'

import { RobotWorkSpace } from '../Deck'
import { CalibrationBlockRender } from './CalibrationBlockRender'

import type { Meta, StoryObj } from '@storybook/react'

const LOAD_NAMES = [
  'opentrons_calibrationblock_short_side_left',
  'opentrons_calibrationblock_short_side_right',
]
const DEFS_BY_URI = Object.fromEntries(
  Object.entries(getAllDefinitions()).filter(([uri, def]) =>
    LOAD_NAMES.includes(def.parameters.loadName)
  )
)

const meta: Meta<typeof CalibrationBlockRender> = {
  title: 'Library/Molecules/Simulation/CalibrationBlockRender',
  component: CalibrationBlockRender,
  decorators: [
    (Story, context) => {
      const { labwareDef } = context.args
      const { minX, minY, xDimension, yDimension } = getLabwareViewBox(
        labwareDef
      )
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
