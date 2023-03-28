import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { Flex, SPACING } from '@opentrons/components'
import { GlobalStyle } from '../../atoms/GlobalStyle'
import { CardButton } from '.'

import type { Story, Meta } from '@storybook/react'

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
    <Flex marginTop={SPACING.spacing4}>
      <CardButton {...args} />
    </Flex>
  </MemoryRouter>
)

export const Primary = Template.bind({})
Primary.args = {
  cardWidth: '15.375rem',
  cardHeight: '17rem',
  title: 'Header',
  iconName: 'wifi',
  description: 'Subtext.',
  distPath: '/app-molecules-cardbutton--primary',
}
