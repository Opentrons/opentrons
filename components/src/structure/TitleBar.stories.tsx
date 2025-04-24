import { Icon, SIZE_1, Text } from '@opentrons/components'

import { TitleBar } from './TitleBar'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'Library/Molecules/TitleBar',
} as Meta

const Template: Story<React.ComponentProps<typeof TitleBar>> = args => (
  <TitleBar {...args} />
)
export const Basic = Template.bind({})
Basic.args = {
  title: 'Main Title Goes Here',
  subtitle: "I'm the sub-title",
}

export const TitlesAsReactNodes = Template.bind({})
TitlesAsReactNodes.args = {
  title: (
    <Text as="span">
      Fancy Title With Icon <Icon size={SIZE_1} name="wifi" />
    </Text>
  ),
  subtitle: (
    <Text as="a" href="#">
      sub-title as link
    </Text>
  ),
}

export const WithBackButton = Template.bind({})
WithBackButton.args = {
  title: 'Main Title Goes Here',
  subtitle: "I'm the sub-title",
  back: {
    children: 'back',
    onClick: () => {},
  },
}
