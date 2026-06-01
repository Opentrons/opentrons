import * as React from 'react'
import { action } from 'storybook/actions'

import {
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  PrimaryButton,
  SPACING,
  StyledText,
  useLongPress,
} from '@opentrons/components'

import { AccountIconButton } from './AccountIconButton'
import {
  QuaternaryButton,
  SubmitPrimaryButton,
  TertiaryButton,
  TextOnlyButton,
  ToggleButton,
  TouchControlButton,
} from './index'

import type { Meta, Story } from '@storybook/react'
import type { ComponentProps } from 'react'

export default {
  title: 'App/Atoms/Buttons',
} as Meta

const TertiaryButtonTemplate: Story<
  ComponentProps<typeof TertiaryButton>
> = args => {
  const { children, onClick } = args
  return (
    <div style={{ padding: SPACING.spacing16 }}>
      <TertiaryButton onClick={onClick}>{children}</TertiaryButton>
    </div>
  )
}

export const Tertiary = TertiaryButtonTemplate.bind({})
Tertiary.args = {
  children: 'tertiary button',
  onClick: () => {
    action('tertiary button clicked')()
  },
}

const QuaternaryButtonTemplate: Story<
  ComponentProps<typeof QuaternaryButton>
> = args => {
  const { children, onClick } = args
  return (
    <div style={{ padding: SPACING.spacing16 }}>
      <QuaternaryButton onClick={onClick}>{children}</QuaternaryButton>
    </div>
  )
}

export const Quaternary = QuaternaryButtonTemplate.bind({})
Quaternary.args = {
  children: 'quaternary button',
  onClick: () => {
    action('quaternary button clicked')()
  },
}

const SubmitPrimaryButtonTemplate: Story<
  ComponentProps<typeof SubmitPrimaryButton>
> = args => {
  return (
    <div style={{ padding: SPACING.spacing16, width: '15rem' }}>
      <SubmitPrimaryButton {...args} />
    </div>
  )
}

export const SubmitPrimary = SubmitPrimaryButtonTemplate.bind({})
SubmitPrimary.args = {
  form: 'storybook-form',
  value: 'submit primary button',
  onClick: () => {
    action('submit primary button clicked')()
  },
  disabled: false,
}

const TouchControlButtonTemplate: Story<
  ComponentProps<typeof TouchControlButton>
> = args => {
  return (
    <div style={{ padding: SPACING.spacing16 }}>
      <TouchControlButton {...args} />
    </div>
  )
}

export const TouchControl = TouchControlButtonTemplate.bind({})
TouchControl.args = {
  title: 'touch control button',
  subText: 'touch control subtext',
  isActive: true,
  isOnDevice: false,
  onClick: () => {
    action('touch control button clicked')()
  },
}

const ToggleButtonTemplate: Story<
  ComponentProps<typeof ToggleButton>
> = args => {
  const { onClick, ...rest } = args
  const [isToggled, setIsToggled] = React.useState<boolean>(false)
  const handleClick = (): void => {
    setIsToggled(currentIsToggled => !currentIsToggled)
  }
  return (
    <div style={{ padding: SPACING.spacing16 }}>
      <ToggleButton {...rest} toggledOn={isToggled} onClick={handleClick} />
    </div>
  )
}

export const Toggle = ToggleButtonTemplate.bind({})
Toggle.args = {
  label: 'toggle button',
  id: 'storybook-toggle-button',
}

const LongPressButtonTemplate: Story<
  ComponentProps<typeof PrimaryButton>
> = args => {
  const { children } = args
  const longPress = useLongPress()
  const [tapCount, setTapCount] = React.useState(0)

  const handlePress = (): void => {
    if (Boolean(longPress.isLongPressed)) {
      alert('pressed the button more than 3 sec')
    } else {
      setTapCount(prev => prev + 1)
    }
  }

  React.useEffect(() => {
    if (Boolean(longPress.isLongPressed)) {
      alert('pressed the button more than 2 sec')
      longPress.setIsLongPressed(false)
    }
  }, [longPress, longPress.isLongPressed])

  return (
    <div
      style={{
        display: DISPLAY_FLEX,
        flexDirection: DIRECTION_COLUMN,
        padding: SPACING.spacing16,
        gap: SPACING.spacing16,
      }}
    >
      <PrimaryButton ref={longPress.ref} width="16rem" onClick={handlePress}>
        {children}
      </PrimaryButton>
      <StyledText>{`You tapped ${tapCount} times`}</StyledText>
    </div>
  )
}

export const LongPress = LongPressButtonTemplate.bind({})
LongPress.args = {
  children: 'long press - 2sec / tap',
}

const TextOnlyButtonTemplate: Story<
  ComponentProps<typeof TextOnlyButton>
> = () => {
  const [count, setCount] = React.useState<number>(0)
  return (
    <TextOnlyButton
      onClick={() => {
        setCount(prev => prev + 1)
      }}
      buttonText={`You clicked me ${count} times`}
    />
  )
}

export const TextOnly = TextOnlyButtonTemplate.bind({})

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
