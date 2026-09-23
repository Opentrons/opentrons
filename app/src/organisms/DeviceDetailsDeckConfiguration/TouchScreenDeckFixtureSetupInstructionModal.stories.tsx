import { VIEWPORT } from '@opentrons/components'

import { DeckFixtureSetupInstructionsModal as DeckFixtureSetupInstructionsModalComponent } from './DeckFixtureSetupInstructionsModal'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof DeckFixtureSetupInstructionsModalComponent> = {
  title: 'ODD/Organisms/DeckFixtureSetupInstructionsModal',
  component: DeckFixtureSetupInstructionsModalComponent,
  ...VIEWPORT.touchScreenViewport,
}

export default meta

type Story = StoryObj<typeof DeckFixtureSetupInstructionsModalComponent>

export const Default: Story = {
  args: {
    setShowSetupInstructionsModal: () => {},
    isOnDevice: true,
  },
}
