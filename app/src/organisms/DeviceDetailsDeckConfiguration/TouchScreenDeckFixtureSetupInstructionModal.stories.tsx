import type * as React from 'react'
import { VIEWPORT } from '@opentrons/components'
import { DeckFixtureSetupInstructionsModal } from './DeckFixtureSetupInstructionsModal'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Organisms/DeckFixtureSetupInstructionsModal',
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
  React.ComponentProps<typeof DeckFixtureSetupInstructionsModal>
> = args => <DeckFixtureSetupInstructionsModal {...args} />
export const Default = Template.bind({})
Default.args = {
  setShowSetupInstructionsModal: () => {},
  isOnDevice: true,
}
