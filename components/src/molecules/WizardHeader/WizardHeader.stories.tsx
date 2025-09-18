import { WizardHeader as WizardHeaderComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof WizardHeaderComponent> = {
  title: 'Helix/Molecules/WizardHeader',
  component: WizardHeaderComponent,
}

export default meta

type Story = StoryObj<typeof WizardHeaderComponent>

export const WizardHeader: Story = {
  args: {
    totalSteps: 5,
    currentStep: 2,
    title: 'Tip Length Calibration',
  },
}

export const WizardHeaderCurrentStepZero: Story = {
  args: {
    totalSteps: 5,
    currentStep: 0,
    title: 'Tip Length Calibration',
  },
}

export const WizardHeaderNoExit: Story = {
  args: {
    totalSteps: 5,
    currentStep: 1,
    onExit: null,
    title: 'Tip Length Calibration',
  },
}

export const WizardHeaderHideStepText: Story = {
  args: {
    totalSteps: 5,
    currentStep: 1,
    hideStepText: true,
    title: 'Tip Length Calibration',
  },
}
