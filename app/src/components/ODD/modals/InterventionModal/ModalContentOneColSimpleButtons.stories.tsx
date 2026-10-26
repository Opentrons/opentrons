import { ModalContentOneColSimpleButtons as ModalContentOneColSimpleButtonsComponent } from './ModalContentOneColSimpleButtons'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ModalContentOneColSimpleButtonsComponent> = {
  title: 'App/Molecules/InterventionModal/ModalContentOneColSimpleButtons',
  component: ModalContentOneColSimpleButtonsComponent,
  argTypes: {
    buttons: {
      control: { type: 'array' },
    },
  },
}

export default meta

type Story = StoryObj<typeof ModalContentOneColSimpleButtonsComponent>

export const ModalContentOneColSimpleButtons: Story = {
  args: {
    headline: 'This is the headline area.',
    buttons: [
      'This is the first button',
      'This is the second button',
      'this is the third button',
      'this is the fourth button',
    ],
  },
  render: (args, context) => {
    return (
      <ModalContentOneColSimpleButtonsComponent
        headline={args.headline}
        buttons={args.buttons
          .map(label =>
            label === '' || label == null
              ? null
              : { label: label, value: label }
          )
          .filter(val => val != null)}
      />
    )
  },
}
