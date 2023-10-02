import * as React from 'react'
import { touchScreenViewport } from '../../DesignTokens/constants'
import { DeckFixtureSetupInstructionModal } from './DeckFixtureSetupInstructionModal'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Organisms/DeckFixtureSetupInstructionModal',
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
  React.ComponentProps<typeof DeckFixtureSetupInstructionModal>
> = args => <DeckFixtureSetupInstructionModal {...args} />
export const Default = Template.bind({})
Default.args = {
  setShowSetupInstructionsModal: () => {},
}
