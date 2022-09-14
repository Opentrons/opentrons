import * as React from 'react'
import { Flex, COLORS } from '@opentrons/components'
import { NavTab } from './'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/NavTab',
  component: NavTab,
} as Meta

const Template: Story<React.ComponentProps<typeof NavTab>> = args => (
  <Flex backgroundColor={COLORS.fundamentalsBackground}>
    <NavTab {...args} />
  </Flex>
)

export const Primary = Template.bind({})
Primary.args = {
  href: 'https://www.opentrons.com',
  children: 'Open the link',
}
