import { VIEWPORT } from '@opentrons/components'

import { MediaContainerContent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof MediaContainerContent> = {
  title: 'App/Molecules/MediaContainer',
  component: MediaContainerContent,
  ...VIEWPORT.touchScreenViewport,
  argTypes: {
    state: {
      control: {
        type: 'radio',
      },
      options: ['loading', 'error', 'neutral'],
    },
    overflowMenuActions: {
      control: 'object',
      description: 'dictionary of menu actions with label and handler',
    },
  },
}

export default meta

type Story = StoryObj<typeof MediaContainerContent>

export const MediaContainerContentComponent: Story = {
  args: {
    mediaContent: (
      <img
        src="https://via.placeholder.com/300x200.png?text=Sample+Image"
        alt="Sample"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '0.5rem',
        }}
      />
    ),
    centerPrimaryText: 'Example Image Title',
    centerSecondaryText: 'Taken during experiment',
    rightPrimaryText: '2:45 PM',
    state: 'loading',
    overflowMenu: true,
    overflowMenuActions: [{ label: 'view media', onClick: () => {} }],
    mediaContentOnClick: () => {},
    hoverText: 'Click to view image',
  },
}
