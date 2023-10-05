import * as React from 'react'
import { touchScreenViewport } from '../../DesignTokens/constants'
import { AddDeckConfigurationModal } from './AddDeckConfigurationModal'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Organisms/AddDeckConfigurationModal',
  argTypes: {
    modalSize: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
    },
    onOutsideClick: { action: 'clicked' },
  },
  parameters: touchScreenViewport,
} as Meta

const Template: Story<
  React.ComponentProps<typeof AddDeckConfigurationModal>
> = args => <AddDeckConfigurationModal {...args} />
export const Default = Template.bind({})
Default.args = {
  fixtureLocation: 'D3',
  setShowAddFixtureModal: () => {},
  isOnDevice: true,
}
