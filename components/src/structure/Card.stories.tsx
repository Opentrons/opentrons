import { Box, SIZE_4, SPACING_3, Text } from '@opentrons/components'

import { Card as CardComponent } from './Card'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'Library/Molecules/Card',
} as Meta

const Template: Story<React.ComponentProps<typeof CardComponent>> = args => (
  <CardComponent {...args} />
)
export const Card = Template.bind({})
Card.args = {
  title: 'Main Title Goes Here',
  disabled: false,
  children: (
    <>
      <Box size={SIZE_4} padding={SPACING_3}>
        <Text>Some text contents</Text>
      </Box>
      <Box size={SIZE_4} padding={SPACING_3}>
        <Text>Some more text contents</Text>
      </Box>
    </>
  ),
}
