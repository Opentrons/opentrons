import { VIEWPORT } from '@opentrons/components'
import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'
import { DeckFixtureSetupInstructionsModal } from './DeckFixtureSetupInstructionsModal'

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
