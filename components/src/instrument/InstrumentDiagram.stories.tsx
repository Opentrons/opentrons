import { InstrumentDiagram as InstrumentDiagramComponent } from './InstrumentDiagram'
import { getAllPipetteNames, getPipetteNameSpecs } from '@opentrons/shared-data'
import type { Story, Meta } from '@storybook/react'
import keyBy from 'lodash/keyBy'
import * as React from 'react'

const allPipetteSpecsByDisplayNames = keyBy(
  getAllPipetteNames().map(getPipetteNameSpecs),
  'displayName'
)

export default {
  title: 'Library/Organisms/Instrument Diagram',
  argTypes: {
    mount: {
      control: {
        type: 'select',
        options: ['left', 'right'],
      },
      defaultValue: 'left',
    },
    pipetteSpecs: {
      control: {
        type: 'select',
        options: Object.keys(allPipetteSpecsByDisplayNames),
      },
      defaultValue: Object.keys(allPipetteSpecsByDisplayNames)[0],
    },
  },
} as Meta

const Template: Story<
  React.ComponentProps<typeof InstrumentDiagramComponent>
> = ({ pipetteSpecs, ...args }) => (
  <InstrumentDiagramComponent
    {...args}
    pipetteSpecs={allPipetteSpecsByDisplayNames[pipetteSpecs]}
  />
)
export const InstrumentDiagram = Template.bind({})
