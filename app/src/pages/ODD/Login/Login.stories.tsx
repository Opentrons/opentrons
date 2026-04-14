import { VIEWPORT } from '@opentrons/components'

import { Login as LoginComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'
import type { SmallButton } from '/app/atoms/buttons'

const meta: Meta<typeof LoginComponent> = {
  title: 'ODD/Pages/Login',
  component: LoginComponent,
  parameters: VIEWPORT.touchScreenViewport,
}
export default meta

type Story = StoryObj<typeof LoginComponent>

export const Login: Story = {}