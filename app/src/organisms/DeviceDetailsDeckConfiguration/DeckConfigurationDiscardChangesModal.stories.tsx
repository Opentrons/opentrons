import { MemoryRouter } from 'react-router-dom'

import { VIEWPORT } from '@opentrons/components'

import { DeckConfigurationDiscardChangesModal } from './DeckConfigurationDiscardChangesModal'

import type { Meta, Story } from '@storybook/react'

export default {
  title: 'ODD/Organisms/DeckConfigurationDiscardChangesModal',
  component: DeckConfigurationDiscardChangesModal,
  argTypes: {
    modalSize: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
    },
    onOutsideClick: { action: 'clicked' },
  },
  ...VIEWPORT.touchScreenViewport,
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} as Meta

const Template: Story<
  React.ComponentProps<typeof DeckConfigurationDiscardChangesModal>
> = args => <DeckConfigurationDiscardChangesModal {...args} />

export const Default = Template.bind({})
Default.args = {
  setShowConfirmationModal: () => {},
}
