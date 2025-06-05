import { getAllDefinitions, getSchema2Dimensions } from '@opentrons/shared-data'
import { RobotWorkSpace } from '../Deck'
import { CalibrationBlockRender } from './CalibrationBlockRender'

import type { Meta, StoryObj } from '@storybook/react'

const LOAD_NAMES = ["opentrons_calibrationblock_short_side_left", "opentrons_calibrationblock_short_side_right"]
const DEFS_BY_URI = Object.fromEntries(
  Object.entries(
    getAllDefinitions()
  ).filter(
    ([uri, def]) => LOAD_NAMES.includes(def.parameters.loadName)
  )
)


const meta = {
  component: CalibrationBlockRender,
  decorators: [
    (Story, context) => {
      const {labwareDef} = context.args
      // todo(mm, 2025-06-05): Update viewBox to account for labware schema 3.
      const {xDimension, yDimension} = getSchema2Dimensions(labwareDef)
      const viewBox = `0 0 ${xDimension} ${yDimension}`

      return <RobotWorkSpace viewBox={viewBox}>
        {() => <Story />}
      </RobotWorkSpace>
    }
  ]
} satisfies Meta<typeof CalibrationBlockRender>

export default meta;
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    labwareDef: Object.keys(DEFS_BY_URI)[0]
  },
  argTypes: {
    labwareDef: {
      options: Object.keys(DEFS_BY_URI),
      defaultValue: Object.keys(DEFS_BY_URI)[0],
      mapping: DEFS_BY_URI
    }
  }
}
