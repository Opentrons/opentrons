import * as React from 'react'
import { VIEWPORT } from '@opentrons/components'
import { ChildNavigation } from '.'
import type { Story, Meta } from '@storybook/react'
import type { SmallButton } from '../../atoms/buttons'

export default {
  title: 'ODD/Organisms/ChildNavigation',
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

const Template: Story<React.ComponentProps<typeof ChildNavigation>> = args => (
  <ChildNavigation {...args} />
)
export const Default = Template.bind({})
Default.args = {
  header: 'Header',
  onClickBack: () => {},
}

export const TitleNoBackButton = Template.bind({})
TitleNoBackButton.args = {
  header: 'Header',
  onClickBack: undefined,
}

export const TitleWithNormalSmallButton = Template.bind({})
TitleWithNormalSmallButton.args = {
  header: 'Header',
  buttonText: 'ButtonText',
  onClickButton: () => {},
  onClickBack: () => {},
}

export const TitleWithNormalSmallButtonDisabled = Template.bind({})
TitleWithNormalSmallButtonDisabled.args = {
  header: 'Header',
  buttonText: 'ButtonText',
  onClickButton: () => {},
  onClickBack: () => {},
  buttonIsDisabled: true,
}

export const TitleWithLinkButton = Template.bind({})
TitleWithLinkButton.args = {
  header: 'Header',
  buttonText: 'Setup Instructions',
  buttonType: 'tertiaryLowLight',
  iconName: 'information',
  iconPlacement: 'startIcon',
  onClickButton: () => {},
  onClickBack: () => {},
}

export const TitleWithTwoButtons = Template.bind({})
const secondaryButtonProps: React.ComponentProps<typeof SmallButton> = {
  onClick: () => {},
  buttonText: 'Setup Instructions',
  buttonType: 'tertiaryLowLight',
  iconName: 'information',
  iconPlacement: 'startIcon',
}
TitleWithTwoButtons.args = {
  header: 'Header',
  buttonText: 'ButtonText',
  onClickButton: () => {},
  secondaryButtonProps,
  onClickBack: () => {},
}
