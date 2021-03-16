import * as React from 'react'
import { Box } from './Box'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/Box',
} as Meta

const Template: Story<React.ComponentProps<typeof Box>> = args => (
  <Box {...args} />
)
export const Simple = Template.bind({})
Simple.args = {
  children:
    'This is a simple box atom that accepts all primitive styling props.',
  backgroundColor: 'grey',
  border: '1px solid black',
  padding: '1rem',
  maxWidth: '20rem',
}
