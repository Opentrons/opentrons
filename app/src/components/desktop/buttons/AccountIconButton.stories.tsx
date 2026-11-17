import { action } from 'storybook/actions'

import { AccountIconButton } from './AccountIconButton'

import type { Meta, Story } from '@storybook/react'
import type { ComponentProps } from 'react'

export default {
  title: 'App/Atoms/Buttons/AccountIconButton',
} as Meta

const AccountIconButtonTemplate: Story<
  ComponentProps<typeof AccountIconButton>
> = args => {
  return (
    <div>
      <AccountIconButton {...args} />
    </div>
  )
}

export const AccountIcon = AccountIconButtonTemplate.bind({})
AccountIcon.args = {
  initial: 'F',
  onClick: action('account icon button clicked'),
}
