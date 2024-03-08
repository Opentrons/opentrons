import * as React from 'react'
<<<<<<< HEAD
import { COLORS, VIEWPORT } from '@opentrons/components'
=======
import { COLORS } from '@opentrons/components'
import { touchScreenViewport } from '../../DesignTokens/constants'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
import { ModalHeader } from './ModalHeader'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Molecules/Modal/ModalHeader',
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

const Template: Story<React.ComponentProps<typeof ModalHeader>> = args => (
  <ModalHeader {...args} />
)
export const Default = Template.bind({})
Default.args = {
  title: 'Header',
  hasExitIcon: true,
  iconName: 'information',
  iconColor: COLORS.black90,
}
