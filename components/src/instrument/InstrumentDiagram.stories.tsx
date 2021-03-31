import * as React from 'react'
import keyBy from 'lodash/keyBy'
import { getAllPipetteNames, getPipetteNameSpecs } from '@opentrons/shared-data'

import { InstrumentDiagram } from './InstrumentDiagram'

import type { Story, Meta } from '@storybook/react'

const allPipetteSpecsByDisplayNames = keyBy(getAllPipetteNames().map(getPipetteNameSpecs), 'displayName')

export default {
  title: 'Library/Organisms/InstrumentDiagram',
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
    }
  }
}


const Template: Story<React.ComponentProps<typeof InstrumentDiagram>> = ({pipetteSpecs, ...args}) => (
  <InstrumentDiagram {...args} pipetteSpecs={allPipetteSpecsByDisplayNames[pipetteSpecs]} />
)
export const Basic = Template.bind({})
