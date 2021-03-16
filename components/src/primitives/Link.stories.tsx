import * as React from 'react'
import { Link } from './Link'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/Link',
} as Meta

const Template: Story<React.ComponentProps<typeof Link>> = args => (
  <Link {...args} />
)
export const Simple = Template.bind({})
Simple.args = {
  children: 'hello anchor',
  href: '#',
}

export const External = Template.bind({})
External.args = {
  children: 'hello opentrons',
  external: true,
  href: 'https://www.opentrons.com',
}
