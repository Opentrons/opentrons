import { VIEWPORT } from '@opentrons/components'

import { ODDMediaContainerContent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ODDMediaContainerContent> = {
  title: 'App/Molecules/ODDMediaContainer',
  component: ODDMediaContainerContent,
  ...VIEWPORT.touchScreenViewport,
  argTypes: {
    state: {
      control: {
        type: 'radio',
      },
      options: ['loading', 'error', 'neutral'],
    },
  },
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
    state: 'loading',
  },
}
