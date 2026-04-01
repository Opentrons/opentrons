import { ALIGN_CENTER, Flex, JUSTIFY_CENTER } from '@opentrons/components'

import { Slider } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Slider> = {
  title: 'Helix/Atoms/Slider',
  component: Slider,
  decorators: [
    Story => (
      <Flex
        width="20rem"
        height="22rem"
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
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
