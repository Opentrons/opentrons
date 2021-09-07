import * as React from 'react'
import reduce from 'lodash/reduce'
import keyBy from 'lodash/keyBy'
import { getAllPipetteNames, getPipetteNameSpecs } from '@opentrons/shared-data'

import { InstrumentGroup as InstrumentGroupComponent } from './InstrumentGroup'

import type { Story, Meta } from '@storybook/react'

const allPipetteSpecsByDisplayNames = keyBy(
  getAllPipetteNames().map(getPipetteNameSpecs),
  'displayName'
)
const leftPipettesByName = reduce(
  allPipetteSpecsByDisplayNames,
  (acc, pipetteSpecs, displayName) => {
    return {
      ...acc,
      [displayName]: {
        mount: 'left',
        description: displayName,
        pipetteSpecs,
        isDisabled: false,
      },
    }
  },
  {}
)
const rightPipettesByName = reduce(
  allPipetteSpecsByDisplayNames,
  (acc, pipetteSpecs, displayName) => {
    return {
      ...acc,
      [displayName]: {
        mount: 'right',
        description: displayName,
        pipetteSpecs,
        isDisabled: false,
      },
    }
  },
  {}
)

export default {
  title: 'Library/Organisms/Instrument Group',
  argTypes: {
    left: {
      control: {
        type: 'select',
        options: Object.keys(leftPipettesByName),
      },
      defaultValue: Object.keys(leftPipettesByName)[0],
    },
    right: {
      control: {
        type: 'select',
        options: Object.keys(rightPipettesByName),
      },
      defaultValue: Object.keys(rightPipettesByName)[0],
    },
  },
} as Meta

const Template: Story<
  React.ComponentProps<typeof InstrumentGroupComponent>
> = ({ left, right, ...args }) => (
  <InstrumentGroupComponent
    {...args}
    left={leftPipettesByName[left]}
    right={rightPipettesByName[right]}
  />
)
export const InstrumentGroup = Template.bind({})
InstrumentGroup.args = {
  left: {
    mount: 'left',
    description: 'p300 8-Channel',
    pipetteSpecs: { channels: 8, displayCategory: 'GEN1' },
    isDisabled: false,
  },
  right: {
    mount: 'right',
    description: 'p10 Single',
    pipetteSpecs: { channels: 1, displayCategory: 'GEN2' },
    isDisabled: true,
  },
}
