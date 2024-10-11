import { Flex, SPACING, VIEWPORT } from '@opentrons/components'
import { EmptyFile as EmptyFileComponent } from './EmptyFile'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof EmptyFileComponent> = {
  title: 'ODD/Organisms/EmptyFile',
  component: EmptyFileComponent,
  parameters: VIEWPORT.touchScreenViewport,
  decorators: [
    Story => (
      <Flex padding={SPACING.spacing16}>
        <Story />
      </Flex>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof EmptyFileComponent>

export const EmptyFile: Story = {}
