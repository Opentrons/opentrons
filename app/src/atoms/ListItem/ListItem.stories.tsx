import * as React from 'react'
import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { StyledText } from '../text'
import { ListItem } from '.'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/ListItem',
  argTypes: {
    type: {
      control: {
        type: 'select',
        options: ['error', 'noActive', 'success', 'warning'],
      },
    },
  },
} as Meta

const ListItemTemplate: Story<React.ComponentProps<typeof ListItem>> = args => (
  <ListItem {...args} />
)

export const Item = ListItemTemplate.bind({})
Item.args = {
  type: 'noActive',
  children: (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <StyledText as="p">
        Slot Component: Replace me using the component panel.
      </StyledText>
      <StyledText as="p">
        Slot Component: Replace me using the component panel.
      </StyledText>
      <StyledText as="p">
        Slot Component: Replace me using the component panel.
      </StyledText>
    </Flex>
  ),
}
