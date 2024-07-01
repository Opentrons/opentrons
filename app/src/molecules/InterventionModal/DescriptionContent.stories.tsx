import { DescriptionContent as DescriptionContentComponent } from './'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<DescriptionContentComponent> = {
  title: 'App/Molecules/InterventionModal/DescriptionContent',
  component: DescriptionContentComponent,
}

export default meta

export type Story = StoryObj<DescriptionContentComponent>

export const ExampleDescriptionContent: Story = {
  args: {
    headline: 'Headline',
    message:
      'At odio faucibus ac eget lorem habitasse. Non pretium pellentesque mattis arcu pellentesque in a odio sapien. Ut dignissim amet odio adipiscing ipsum condimentum sit ac lacus. Amet elit felis aenean laoreet sem erat arcu felis. Nulla magna facilisis velit tortor dictumst mauris quam faucibus.',
    notificationHeader: 'Header goes here',
    notificationMessage:
      'Keep subtext short, no more than two lines and use regular weight',
  },
}
