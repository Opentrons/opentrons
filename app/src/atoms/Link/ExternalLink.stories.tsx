import { COLORS, Flex, SPACING } from '@opentrons/components'
import type { Meta, StoryObj } from '@storybook/react'
import { ExternalLink as ExternalLinkComponent } from './ExternalLink'

const meta: Meta<typeof ExternalLinkComponent> = {
  title: 'App/Atoms/ExternalLink',
  component: ExternalLinkComponent,
  decorators: [
    Story => (
      <Flex backgroundColor={COLORS.grey10} padding={SPACING.spacing16}>
        <Story />
      </Flex>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof ExternalLinkComponent>

export const ExternalLink: Story = {
  args: {
    href: 'https://www.opentrons.com',
    children: 'Open the link',
  },
}
