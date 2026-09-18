import { VIEWPORT } from '@opentrons/components'

import { OddInfoScreen } from './OddInfoScreen'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'ODD/Molecules/ODDInfoScreen',
  argTypes: {
    type: {
      options: ['error', 'alt', 'neutral', 'success', 'warning'],
      control: {
        type: 'radio',
      },
    },
    hasIcon: {
      control: {
        type: 'boolean',
      },
    },
    header: {
      context: 'text',
    },
    subText: {
      control: 'text',
    },
    textSize: {
      options: ['small', 'large'],
      control: {
        type: 'radio',
      },
    },
    iconName: {
      options: ['connection-status', 'ot-check', undefined],
      control: {
        type: 'text',
      },
    },
  },
  ...VIEWPORT.touchScreenViewport,
} as Meta

const Template: Story<React.ComponentProps<typeof OddInfoScreen>> = args => (
  <OddInfoScreen {...args} />
)

export const Default = Template.bind({})
Default.args = {
  type: 'neutral',
  hasIcon: true,
  header: 'Header',
  subText: 'Subtext',
  textSize: 'small',
  iconName: undefined,
}
