import type * as React from 'react'
import { COLORS, Flex, BORDERS, SPACING, VIEWPORT } from '@opentrons/components'
import { OddModal } from './OddModal'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Molecules/OddModal/OddModal',
  argTypes: {
    modalSize: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
    },
    onOutsideClick: { action: 'clicked' },
  },
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

const Template: Story<React.ComponentProps<typeof OddModal>> = args => (
  <OddModal {...args} />
)
export const Default = Template.bind({})
Default.args = {
  modalSize: 'medium',
  header: {
    title: 'Header',
    hasExitIcon: true,
    iconName: 'information',
    iconColor: COLORS.black90,
  },
  children: (
    <Flex
      borderRadius={`0px 0px ${BORDERS.borderRadius12} ${BORDERS.borderRadius12}`}
      paddingTop={SPACING.spacing32}
      height="23.5rem"
    >
      children goes here
    </Flex>
  ),
}
