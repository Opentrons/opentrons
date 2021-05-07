import * as React from 'react'
import { TitleBar } from './TitleBar'
import { Text, Icon, SIZE_1 } from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

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
