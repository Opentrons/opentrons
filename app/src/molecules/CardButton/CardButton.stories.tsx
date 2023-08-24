import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { Flex, SPACING } from '@opentrons/components'
import { customViewports } from '../../../../.storybook/preview'
import { GlobalStyle } from '../../atoms/GlobalStyle'
import { CardButton } from '.'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Molecules/CardButton',
  component: CardButton,
  parameters: {
    viewport: {
      viewports: customViewports,
      defaultViewport: 'onDeviceDisplay',
    },
  },
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
    <Flex marginTop={SPACING.spacing16} width="15.375rem" height="17rem">
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
