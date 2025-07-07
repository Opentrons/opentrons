import { VIEWPORT } from '@opentrons/components'

import { DeckConfigurationDiscardChangesModal } from './DeckConfigurationDiscardChangesModal'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'ODD/Organisms/DeckConfigurationDiscardChangesModalProps',
  argTypes: {
    modalSize: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
    },
    onOutsideClick: { action: 'clicked' },
  },
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

const Template: Story<
  React.ComponentProps<typeof DeckConfigurationDiscardChangesModal>
> = args => <DeckConfigurationDiscardChangesModal {...args} />
export const Default = Template.bind({})
Default.args = {
  setShowConfirmationModal: () => {},
}
