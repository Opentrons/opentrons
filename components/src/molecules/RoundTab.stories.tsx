import * as React from 'react'
import { Flex, SPACING, TYPOGRAPHY, Text, DIRECTION_ROW } from '..'
import { RoundTab } from './RoundTab'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/RoundTab',
  component: RoundTab,
} as Meta

const Template: Story<React.ComponentProps<typeof RoundTab>> = args => (
  <Flex
    width="100%"
    height="100%"
    flexDirection={DIRECTION_ROW}
    marginLeft={SPACING.spacing4}
  >
    <RoundTab {...args}>
      <Text textTransform={TYPOGRAPHY.textTransformCapitalize}>
        {'Protocol Name and Description'}
      </Text>
    </RoundTab>

    <RoundTab isCurrent={false}>
      <Text textTransform={TYPOGRAPHY.textTransformCapitalize}>
        {'Pipette Selection'}
      </Text>
    </RoundTab>

    <RoundTab isCurrent={false}>
      <Text textTransform={TYPOGRAPHY.textTransformCapitalize}>
        {'Module Selection'}
      </Text>
    </RoundTab>
  </Flex>
)
export const Basic = Template.bind({})
Basic.args = { isCurrent: true }
