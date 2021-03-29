import * as React from 'react'
import { SidePanel } from './SidePanel'
import {Text, Flex, JUSTIFY_CENTER, ALIGN_CENTER} from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/SidePanel',
  decorators: [
    Story => <Flex><Story /></Flex>
  ]
} as Meta

const Template: Story<React.ComponentProps<typeof SidePanel>> = args => (
  <SidePanel {...args} />
)
export const Simple = Template.bind({})
Simple.args = {
  title: "Title goes here",
  children: (
    <Flex justifyContent={JUSTIFY_CENTER} alignItems={ALIGN_CENTER}>
      <Text>Side Panel Children</Text>
    </Flex>
  )
}
