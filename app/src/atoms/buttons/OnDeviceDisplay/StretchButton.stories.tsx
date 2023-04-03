import * as React from 'react'
import { ALIGN_CENTER, Flex, Icon, JUSTIFY_SPACE_BETWEEN, SIZE_2 } from '@opentrons/components'
import { StretchButton } from '.'
import type { Story, Meta } from '@storybook/react'
import { StyledText } from '../../text'

export default {
  title: 'ODD/Atoms/Buttons/StretchButton',
  argTypes: { onClick: { action: 'clicked' } },
} as Meta

const StretchButtonTemplate: Story<
  React.ComponentProps<typeof StretchButton>
> = args => <StretchButton {...args} />

export const BasicStretchButton = StretchButtonTemplate.bind({})
BasicStretchButton.args = {
  children: (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
      <StyledText as="p">left stuff</StyledText>
      <Icon name="chevron-right" size={SIZE_2}/>
    </Flex>
  ),
  disabled: false,
}
