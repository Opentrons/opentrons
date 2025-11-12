import { Flex, SPACING } from '@opentrons/components'

import { HelixSlider } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof HelixSlider> = {
  title: 'App/Molecules/HelixSlider',
  component: HelixSlider,
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

type Story = StoryObj<typeof HelixSlider>

export const HelixSliderComponent: Story = {
  args: {
    title: 'Brightness',
    subtext: 'Adjust the brightness of the camera feed',
    value: 50,
    adjustValue: () => {},
  },
}
