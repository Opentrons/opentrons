import * as React from 'react'
import { Flex, COLORS } from '@opentrons/components'
import type { Story, Meta } from '@storybook/react'

import { ExternalLink } from './ExternalLink'

export default {
  title: 'App/Atoms/ExternalLink',
  component: ExternalLink,
} as Meta

const Template: Story<React.ComponentProps<typeof ExternalLink>> = args => (
  <Flex backgroundColor={COLORS.fundamentalsBackground}>
    <ExternalLink {...args} />
  </Flex>
)

export const Primary = Template.bind({})
Primary.args = {
  href: 'https://www.opentrons.com',
  children: 'Open the link',
}
