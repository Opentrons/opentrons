import * as React from 'react'
import { ProtocolTimelineScrubber } from './index'
import analysisOutputFixture from './analysisOutputFixture.json'
import longerAnalysisOutputFixture from './longerAnalysisOutputFixture.json'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Organisms/ProtocolTimelineScrubber',
  component: ProtocolTimelineScrubber,
} as Meta

const Template: Story<React.ComponentProps<typeof ProtocolTimelineScrubber>> = args => (
  <ProtocolTimelineScrubber {...args} />
)

export const Basic = Template.bind({})
Basic.args = {
  commands:  analysisOutputFixture.commands
}

export const Larger = Template.bind({})
Larger.args = {
  commands:  longerAnalysisOutputFixture.commands
}