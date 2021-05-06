import * as React from 'react'
import { Box as BoxComponent } from './Box'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/Box',
} as Meta

const Template: Story<React.ComponentProps<typeof BoxComponent>> = args => (
  <BoxComponent {...args} />
)
export const Box = Template.bind({})
Box.args = {
  children:
    'This is a simple box atom that accepts all primitive styling props.',
  backgroundColor: 'grey',
  border: '1px solid black',
  padding: '1rem',
  maxWidth: '20rem',
}
