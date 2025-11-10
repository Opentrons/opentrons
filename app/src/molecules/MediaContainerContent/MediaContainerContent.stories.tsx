import {
  Flex,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'

import { MediaContainerContent } from './index'

import type { Meta, StoryObj } from '@storybook/react'


const meta: Meta<typeof MediaContainerContent> = {
    title: 'Desktop/Molecules/MediaContainer',
    component: MediaContainerContent,
    parameters:VIEWPORT.touchScreenViewport,
   argTypes: {
    state: {
      control: {
        type: 'radio',
      },
      options: ['loading', 'error'],
    },
    hoverText: {
      control: 'text',
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

type Story = StoryObj<typeof MediaContainerContentComponent>

export const MediaContainerContent: Story = {
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
    state: undefined, // use 'loading' | 'error' | undefined
    overflowMenu: null,
    hoverText: 'Click to view image',
  },
}