import successIcon from '/app/assets/images/icon_success.png'

import type { Meta, StoryObj } from '@storybook/react'
import { customViewports } from '../../../../.storybook/preview'

import {
  ModalContentMixed as ModalContentMixedComponent,
  MODAL_CONTENT_MIXED_ICONS,
} from './ModalContentMixed'

const meta: Meta<typeof ModalContentMixedComponent> = {
  title: 'App/Molecules/InterventionModal/ModalContentMixed',
  component: ModalContentMixedComponent,
  argTypes: {
    iconType: {
      control: {
        type: 'select',
      },
      options: Object.keys(MODAL_CONTENT_MIXED_ICONS),
      defaultValue: undefined,
      if: { arg: 'type', eq: 'icon' },
    },
    imageUrl: {
      control: {
        type: 'file',
        accept: '.png',
      },
      if: { arg: 'type', eq: 'image' },
    },
    imageAltText: {
      control: {
        type: 'text',
      },
      defaultValue: undefined,
      if: { arg: 'type', eq: 'image' },
    },
    imageAriaLabel: {
      control: {
        type: 'text',
      },
      defaultValue: undefined,
      if: { arg: 'type', eq: 'image' },
    },
    type: {
      control: {
        type: 'select',
      },
      options: ['icon', 'image', 'spinner', 'no-media'],
      defaultValue: undefined,
    },
  },
  parameters: {
    viewport: {
      viewports: customViewports,
      defaultViewport: 'onDeviceDisplay',
    },
  },
}

export default meta

type Story = StoryObj<typeof ModalContentMixedComponent>

export const ModalContentMixed: Story = {
  args: {
    headline: 'Selectable mixed content',
    subText: 'Mixed content subtext',
    iconType: 'error',
  },
}

export const IconModalContentMixed: Story = {
  args: {
    headline: 'Mixed content with an icon',
    iconType: 'caution',
    subText: 'Intervention is necessary',
    type: 'icon',
  },
}

export const SpinnerModalContentMixed: Story = {
  args: {
    headline: 'Mixed content with a spinner',
    subText: 'Check me out!',
    type: 'spinner',
  },
}

export const ImageModalContentMixed: Story = {
  args: {
    headline: 'Mixed content with an image',
    imgName: 'something',
    subText: 'Isnt this cool?',
    type: 'image',
    imageUrl: successIcon,
    imageAriaLabel: 'Success has occurred',
    imageAltText: 'A successful image',
  },
}

export const NoMediaModalContentMixed: Story = {
  args: {
    headline: 'Mixed content with no media',
    subText: 'This counts too!',
    type: 'no-media',
  },
}
