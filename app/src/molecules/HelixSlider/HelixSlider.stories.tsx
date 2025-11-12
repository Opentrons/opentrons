import { Flex, SPACING } from '@opentrons/components'

import { Slider } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Slider> = {
  title: 'Helix/Molecules/Slider',
  component: Slider,
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

type Story = StoryObj<typeof Slider>

export const SliderComponent: Story = {
  args: {
    title: 'Brightness',
    subtext: 'Adjust the brightness of the camera feed',
    value: 70,
    adjustValue: () => {},
  },
}
