import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
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

const queryClient = new QueryClient()
const Template: Story<
  React.ComponentProps<typeof AddDeckConfigurationModal>
> = args => (
  <QueryClientProvider client={queryClient}>
    <AddDeckConfigurationModal {...args} />
  </QueryClientProvider>
)

export const Default = Template.bind({})
Default.args = {
  fixtureLocation: 'D3',
  setShowAddFixtureModal: () => {},
  isOnDevice: true,
}
