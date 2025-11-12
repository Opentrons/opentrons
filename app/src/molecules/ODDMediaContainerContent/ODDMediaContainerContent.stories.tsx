import { Flex, SPACING, VIEWPORT } from '@opentrons/components'

import { ODDMediaContainerContent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ODDMediaContainerContent> = {
  title: 'App/Molecules/ODDMediaContainer',
  component: ODDMediaContainerContent,
  parameters: VIEWPORT.touchScreenViewport,
  argTypes: {
    state: {
      control: {
        type: 'radio',
      },
      options: ['loading', 'error', 'neutral'],
    },
  },
  decorators: [
    Story => (
      <Flex
        marginTop={SPACING.spacing16}
        width="20rem"
        height="22rem"
        justifyContent="center"
        alignItems="center"
      >
        <Story />
      </Flex>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof ODDMediaContainerContent>

export const MediaContainerContentComponent: Story = {
  args: {
    leftPrimaryText: 'timestamp',
    centerPrimaryText: 'current command step',
    centerSecondaryText: 'previous command',
    rightButtonOnClick: () => {},
    rightButtonText: 'view image',
    state: undefined,
    isCurrentCmdError: false,
  },
}
