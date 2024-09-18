import { VIEWPORT } from '@opentrons/components'
import { ChildNavigation as ChildNavigationComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'
import type { SmallButton } from '/app/atoms/buttons'

const meta: Meta<typeof ChildNavigationComponent> = {
  title: 'ODD/Organisms/ChildNavigation',
  component: ChildNavigationComponent,
  parameters: VIEWPORT.touchScreenViewport,
}
export default meta

type Story = StoryObj<typeof ChildNavigationComponent>

export const ChildNavigation: Story = {
  args: {
    header: 'Header',
    onClickBack: () => {},
  },
}

export const TitleNoBackButton: Story = {
  args: {
    header: 'Header',
    onClickBack: undefined,
  },
}

export const TitleWithNormalSmallButton: Story = {
  args: {
    header: 'Header',
    buttonText: 'ButtonText',
    onClickButton: () => {},
    onClickBack: () => {},
  },
}

export const TitleWithNormalSmallButtonDisabled: Story = {
  args: {
    header: 'Header',
    buttonText: 'ButtonText',
    onClickButton: () => {},
    onClickBack: () => {},
    buttonIsDisabled: true,
  },
}

export const TitleWithLinkButton: Story = {
  args: {
    header: 'Header',
    buttonText: 'Setup Instructions',
    buttonType: 'tertiaryLowLight',
    iconName: 'information',
    iconPlacement: 'startIcon',
    onClickButton: () => {},
    onClickBack: () => {},
  },
}

const secondaryButtonProps: React.ComponentProps<typeof SmallButton> = {
  onClick: () => {},
  buttonText: 'Setup Instructions',
  buttonType: 'tertiaryLowLight',
  iconName: 'information',
  iconPlacement: 'startIcon',
  ariaDisabled: false,
}

export const TitleWithTwoButtons: Story = {
  args: {
    header: 'Header',
    buttonText: 'ButtonText',
    onClickButton: () => {},
    secondaryButtonProps,
    onClickBack: () => {},
  },
}

export const TitleWithTwoButtonsDisabled: Story = {
  args: {
    header: 'Header',
    buttonText: 'ButtonText',
    onClickButton: () => {},
    secondaryButtonProps,
    onClickBack: () => {},
    ariaDisabled: true,
  },
}

export const TitleWithInlineNotification: Story = {
  args: {
    header: 'Header',
    onClickBack: () => {},
    inlineNotification: {
      type: 'neutral',
      heading: 'Inline notification',
    },
  },
}
