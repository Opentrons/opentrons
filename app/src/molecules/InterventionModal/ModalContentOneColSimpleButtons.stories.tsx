import * as React from 'react'
import { ModalContentOneColSimpleButtons as ModalContentOneColSimpleButtonsComponent } from './ModalContentOneColSimpleButtons'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ModalContentOneColSimpleButtonsComponent> = {
  title: 'App/Molecules/InterventionModal/ModalContentOneColSimpleButtons',
  component: ModalContentOneColSimpleButtonsComponent,
  argTypes: {
    firstButton: {
      control: { type: 'text' },
    },
    secondButton: {
      control: { type: 'text' },
    },
    furtherButtons: {
      control: { type: 'array' },
    },
  },
}

export default meta

type Story = StoryObj<typeof ModalContentOneColSimpleButtonsComponent>

export const ModalContentOneColSimpleButtons: Story = {
  args: {
    headline: 'This is the headline area.',
    firstButton: 'This is the first button',
    secondButton: 'This is the second button',
    furtherButtons: ['this is the third button', 'this is the fourth button'],
  },
  render: (args, context) => {
    return (
      <ModalContentOneColSimpleButtonsComponent
        headline={args.headline}
        firstButton={{ label: args.firstButton, value: args.firstButton }}
        secondButton={{ label: args.secondButton, value: args.secondButton }}
        furtherButtons={args.furtherButtons
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
