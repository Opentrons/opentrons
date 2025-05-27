import { QueryClient, QueryClientProvider } from 'react-query'

import { VIEWPORT } from '@opentrons/components'

import { AddFixtureModal } from './AddFixtureModal'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'ODD/Organisms/AddFixtureModal',
  argTypes: {
    modalSize: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
    },
    onOutsideClick: { action: 'clicked' },
  },
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

const queryClient = new QueryClient()
const Template: Story<React.ComponentProps<typeof AddFixtureModal>> = args => (
  <QueryClientProvider client={queryClient}>
    <AddFixtureModal {...args} />
  </QueryClientProvider>
)

export const Default = Template.bind({})
Default.args = {
  fixtureLocation: 'cutoutD3',
  closeModal: () => {},
  isOnDevice: true,
}
