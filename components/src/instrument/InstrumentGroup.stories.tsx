import * as React from 'react'
import { InstrumentGroup } from './InstrumentGroup'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Organisms/InstrumentGroup',
} as Meta

const Template: Story<React.ComponentProps<typeof InstrumentGroup>> = args => (
  <InstrumentGroup {...args} />
)
export const Basic = Template.bind({})
Basic.args = {
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
  }
}
