import { customViewports } from '../../../../.storybook/preview'
import { VIEWPORT } from '../../ui-style-constants'
import { StepMeter as StepMeterComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof StepMeterComponent> = {
  title: 'Helix/Atoms/StepMeter',
  component: StepMeterComponent,
  viewport: {
    options: [VIEWPORT.touchScreenViewport, customViewports],
  },
}

export default meta

type Story = StoryObj<typeof StepMeterComponent>

export const StepMeter: Story = {
  args: {
    totalSteps: 5,
    currentStep: 2,
  },
}
