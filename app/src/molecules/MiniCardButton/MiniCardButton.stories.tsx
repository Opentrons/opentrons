import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { Flex, SPACING } from '@opentrons/components'
import { MiniCardButton } from '.'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Molecules/MiniCardButton',
  component: MiniCardButton,
} as Meta

const Template: Story<React.ComponentProps<typeof MiniCardButton>> = args => (
  <MemoryRouter>
    <Flex marginTop={SPACING.spacing4}>
      <MiniCardButton {...args} />
    </Flex>
  </MemoryRouter>
)

export const Primary = Template.bind({})
Primary.args = {
  iconName: 'wifi',
  cardName: 'Settings',
  distPath: '/app-molecules-minicardbutton--primary',
}
