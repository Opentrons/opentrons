import { action } from 'storybook/actions'

import { SPACING } from '@opentrons/components'

import { QuaternaryButton } from './QuaternaryButton'

import type { Meta, Story } from '@storybook/react'
import type { ComponentProps } from 'react'

export default {
  title: 'App/Atoms/Buttons/QuaternaryButton',
} as Meta

const QuaternaryButtonTemplate: Story<
  ComponentProps<typeof QuaternaryButton>
> = args => {
  const { children, onClick } = args
  return (
    <div style={{ padding: SPACING.spacing16 }}>
      <QuaternaryButton onClick={onClick}>{children}</QuaternaryButton>
    </div>
  )
}

export const Quaternary = QuaternaryButtonTemplate.bind({})
Quaternary.args = {
  children: 'quaternary button',
  onClick: () => {
    action('quaternary button clicked')()
  },
}
