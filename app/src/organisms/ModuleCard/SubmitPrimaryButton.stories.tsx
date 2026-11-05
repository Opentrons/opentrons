import { action } from 'storybook/actions'

import { SPACING } from '@opentrons/components'

import { SubmitPrimaryButton } from './SubmitPrimaryButton'

import type { Meta, Story } from '@storybook/react'
import type { ComponentProps } from 'react'

export default {
  title: 'App/Atoms/Buttons/SubmitPrimaryButton',
} as Meta

const SubmitPrimaryButtonTemplate: Story<
  ComponentProps<typeof SubmitPrimaryButton>
> = args => {
  return (
    <div style={{ padding: SPACING.spacing16, width: '15rem' }}>
      <SubmitPrimaryButton {...args} />
    </div>
  )
}

export const SubmitPrimary = SubmitPrimaryButtonTemplate.bind({})
SubmitPrimary.args = {
  form: 'storybook-form',
  value: 'submit primary button',
  onClick: () => {
    action('submit primary button clicked')()
  },
  disabled: false,
}
