import * as React from 'react'
import { Flex, SPACING } from '@opentrons/components'
import type { Story, Meta } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'

import { CardButton } from '.'
import { GlobalStyle } from '../../atoms/GlobalStyle'

export default {
  title: 'Odd/Molecules/CardButton',
  component: CardButton,
  decorators: [
    Story => (
      <>
        <GlobalStyle isOnDevice />
        <Story />
      </>
    ),
  ],
} as Meta

const Template: Story<React.ComponentProps<typeof CardButton>> = args => (
  <MemoryRouter>
    <Flex marginTop={SPACING.spacing4} width="15.375rem" height="17rem">
      <CardButton {...args} />
    </Flex>
  </MemoryRouter>
)

export const Primary = Template.bind({})
Primary.args = {
  title: 'Header',
  iconName: 'wifi',
  description: 'Subtext.',
  destinationPath: '/app-molecules-cardbutton--primary',
  disabled: false,
}
