import * as React from 'react'
<<<<<<< HEAD
import { ICON_DATA_BY_NAME, VIEWPORT } from '@opentrons/components'
=======
import { ICON_DATA_BY_NAME } from '@opentrons/components'
import { touchScreenViewport } from '../../DesignTokens/constants'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
import { FloatingActionButton } from './'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/Buttons/FloatingActionButton',
  argTypes: {
    iconName: {
      control: {
        type: 'select',
        options: Object.keys(ICON_DATA_BY_NAME),
      },
      defaultValue: undefined,
    },
    onClick: { action: 'clicked' },
  },
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

const FloatingActionButtonTemplate: Story<
  React.ComponentProps<typeof FloatingActionButton>
> = args => <FloatingActionButton {...args} />
export const FloatingActionButtonComponent = FloatingActionButtonTemplate.bind(
  {}
)
FloatingActionButtonComponent.args = {
  buttonText: 'Button text',
  disabled: false,
}
