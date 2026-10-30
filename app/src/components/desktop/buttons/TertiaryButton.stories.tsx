import { action } from 'storybook/actions'

import { SPACING } from '@opentrons/components'

import { TertiaryButton } from './TertiaryButton'

import type { Meta, Story } from '@storybook/react'
import type { ComponentProps } from 'react'

export default {
  title: 'App/Atoms/Buttons/TertiaryButton',
} as Meta

const TertiaryButtonTemplate: Story<
  ComponentProps<typeof TertiaryButton>
> = args => {
  const { children, onClick } = args
  return (
    <div style={{ padding: SPACING.spacing16 }}>
      <TertiaryButton onClick={onClick}>{children}</TertiaryButton>
    </div>
  )
}

export const Tertiary = TertiaryButtonTemplate.bind({})
Tertiary.args = {
  children: 'tertiary button',
  onClick: () => {
    action('tertiary button clicked')()
  },
}
