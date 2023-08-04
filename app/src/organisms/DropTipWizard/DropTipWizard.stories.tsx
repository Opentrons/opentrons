import * as React from 'react'
import { DropTipWizard as DropTipWizardComponent } from './'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<React.ComponentProps<typeof DropTipWizardComponent>> = {
  component: DropTipWizardComponent,
  title: 'App/Organisms/DropTipWizard',
} as Meta

export default meta
type Story = StoryObj<React.ComponentProps<typeof DropTipWizardComponent>>

export const DropTipWizard: Story = {
  render: args => {
    return <DropTipWizardComponent {...args} />
  },
  args: {
    close: ( ) => {console.log('close clicked')}
  }
}
