import * as React from 'react'
import { ProtocolTimelineScrubber } from './index'
import analysisOutputFixture from './analysisOutputFixture.json'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Organisms/ProtocolTimelineScrubber',
  component: ProtocolTimelineScrubber,
} as Meta

const Template: Story<React.ComponentProps<typeof ProtocolTimelineScrubber>> = args => (
  <ProtocolTimelineScrubber {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  commands:  analysisOutputFixture.commands
}
