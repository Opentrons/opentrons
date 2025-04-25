import { ALIGN_CENTER, Flex, JUSTIFY_CENTER, Text } from '@opentrons/components'

import { SidePanel as SidePanelComponent } from './SidePanel'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'Library/Molecules/Side Panel',
  decorators: [
    Story => (
      <Flex>
        <Story />
      </Flex>
    ),
  ],
} as Meta

const Template: Story<
  React.ComponentProps<typeof SidePanelComponent>
> = args => <SidePanelComponent {...args} />
export const SidePanel = Template.bind({})
SidePanel.args = {
  title: 'Title goes here',
  children: (
    <Flex justifyContent={JUSTIFY_CENTER} alignItems={ALIGN_CENTER}>
      <Text>Side Panel Children</Text>
    </Flex>
  ),
}
