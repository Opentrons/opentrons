import { action } from 'storybook/actions'

import { SPACING } from '@opentrons/components'

import { TouchControlButton } from './TouchControlButton'

import type { Meta, Story } from '@storybook/react'
import type { ComponentProps } from 'react'

export default {
  title: 'App/Atoms/Buttons/TouchControlButton',
} as Meta

const TouchControlButtonTemplate: Story<
  ComponentProps<typeof TouchControlButton>
> = args => {
  return (
    <div style={{ padding: SPACING.spacing16 }}>
      <TouchControlButton {...args} />
    </div>
  )
}

export const TouchControl = TouchControlButtonTemplate.bind({})
TouchControl.args = {
  title: 'touch control button',
  subText: 'touch control subtext',
  isActive: true,
  isOnDevice: false,
  onClick: () => {
    action('touch control button clicked')()
  },
}
