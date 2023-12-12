import * as React from 'react'
import { touchScreenViewport } from '../../DesignTokens/constants'
import { DeckConfigurationDiscardChangesModal } from './DeckConfigurationDiscardChangesModal'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Organisms/DeckConfigurationDiscardChangesModalProps',
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
  React.ComponentProps<typeof DeckConfigurationDiscardChangesModal>
> = args => <DeckConfigurationDiscardChangesModal {...args} />
export const Default = Template.bind({})
Default.args = {
  setShowConfirmationModal: () => {},
}
