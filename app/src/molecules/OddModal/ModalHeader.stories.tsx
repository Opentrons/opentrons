import type * as React from 'react'
import { COLORS, VIEWPORT } from '@opentrons/components'
import { OddModalHeader } from './OddModalHeader'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Molecules/OddModal/OddModalHeader',
  argTypes: {
    iconName: {
      options: ['information', 'ot-check', 'ot-alert', undefined],
      control: { type: 'radio' },
    },
    iconColor: {
      control: {
        type: 'color',
        presetColors: [
          COLORS.black90,
          COLORS.blue50,
          COLORS.red50,
          COLORS.green60,
        ],
      },
    },
    onClick: { action: 'clicked' },
  },
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

const Template: Story<React.ComponentProps<typeof OddModalHeader>> = args => (
  <OddModalHeader {...args} />
)
export const Default = Template.bind({})
Default.args = {
  title: 'Header',
  hasExitIcon: true,
  iconName: 'information',
  iconColor: COLORS.black90,
}
