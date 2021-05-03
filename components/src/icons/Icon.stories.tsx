import * as React from 'react'

import { Box, SIZE_3 } from '@opentrons/components'
import { ICON_DATA_BY_NAME } from './icon-data'
import { Icon as IconComponent } from './Icon'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/Icon',
  argTypes: {
    name: {
      control: {
        type: 'select',
        options: Object.keys(ICON_DATA_BY_NAME),
      },
      defaultValue: 'alert',
    },
  },
  decorators: [
    Story => (
      <Box size={SIZE_3}>
        <Story />
      </Box>
    ),
  ],
} as Meta

const Template: Story<React.ComponentProps<typeof IconComponent>> = args => {
  return <IconComponent {...args} />
}
export const Icon = Template.bind({})
Icon.args = { spin: false }
