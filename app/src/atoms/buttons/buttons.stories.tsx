import * as React from 'react'
import {
  Flex,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  SPACING,
  useLongPress,
} from '@opentrons/components'
import {
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
  SecondaryTertiaryButton,
  SubmitPrimaryButton,
  AlertPrimaryButton,
  ToggleButton,
} from './index'
import type { Story, Meta } from '@storybook/react'
import { StyledText } from '../text'

export default {
  title: 'App/Atoms/Buttons',
} as Meta

const PrimaryButtonTemplate: Story<
  React.ComponentProps<typeof PrimaryButton>
> = args => {
  const { children } = args
  return (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
      <PrimaryButton>{children}</PrimaryButton>
    </Flex>
  )
}

export const Primary = PrimaryButtonTemplate.bind({})
Primary.args = {
  children: 'primary button',
}

const SecondaryButtonTemplate: Story<
  React.ComponentProps<typeof SecondaryButton>
> = args => {
  const { children } = args
  return (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
      <SecondaryButton>{children}</SecondaryButton>
    </Flex>
  )
}

export const Secondary = SecondaryButtonTemplate.bind({})
Secondary.args = {
  children: 'secondary button',
}

const TertiaryButtonTemplate: Story<
  React.ComponentProps<typeof TertiaryButton>
> = args => {
  const { children } = args
  return (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
      <TertiaryButton>{children}</TertiaryButton>
    </Flex>
  )
}

export const Tertiary = TertiaryButtonTemplate.bind({})
Tertiary.args = {
  children: 'tertiary button',
}

const SecondaryTertiaryButtonTemplate: Story<
  React.ComponentProps<typeof SecondaryTertiaryButton>
> = args => {
  const { children } = args
  return (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
      <SecondaryTertiaryButton>{children}</SecondaryTertiaryButton>
    </Flex>
  )
}

export const SecondaryTertiary = SecondaryTertiaryButtonTemplate.bind({})
SecondaryTertiary.args = {
  children: 'secondary tertiary button',
}

const SubmitPrimaryButtonTemplate: Story<
  React.ComponentProps<typeof SubmitPrimaryButton>
> = args => {
  return (
    <Flex flexDirection={DIRECTION_ROW} width="15rem">
      <SubmitPrimaryButton {...args} />
    </Flex>
  )
}

export const SubmitPrimary = SubmitPrimaryButtonTemplate.bind({})
SubmitPrimary.args = {
  form: 'storybook-form',
  value: 'submit primary button',
  onClick: () => {
    console.log('submit primary button clicked')
  },
  disabled: false,
}

const AlertPrimaryButtonTemplate: Story<
  React.ComponentProps<typeof AlertPrimaryButton>
> = args => {
  const { children } = args
  return (
    <Flex>
      <AlertPrimaryButton>{children}</AlertPrimaryButton>
    </Flex>
  )
}

export const AlertPrimary = AlertPrimaryButtonTemplate.bind({})
AlertPrimary.args = {
  children: 'alert tertiary button',
}

const ToggleButtonTemplate: Story<
  React.ComponentProps<typeof ToggleButton>
> = args => {
  const { onClick, ...rest } = args
  const [isToggled, setIsToggled] = React.useState<boolean>(false)
  const handleClick = (): void => {
    setIsToggled(currentIsToggled => !currentIsToggled)
  }
  return (
    <Flex>
      <ToggleButton {...rest} toggledOn={isToggled} onClick={handleClick} />
    </Flex>
  )
}

export const Toggle = ToggleButtonTemplate.bind({})
Toggle.args = {
  label: 'toggle button',
  id: 'storybook-toggle-button',
}

const LongPressButtonTemplate: Story<
  React.ComponentProps<typeof PrimaryButton>
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
    <Flex flexDirection={DIRECTION_COLUMN} gap={SPACING.spacing4}>
      <PrimaryButton ref={longPress.ref} width="16rem" onClick={handlePress}>
        {children}
      </PrimaryButton>
      {
        <StyledText
          marginTop={SPACING.spacing4}
        >{`You tapped ${tapCount} times`}</StyledText>
      }
    </Flex>
  )
}

export const LongPress = LongPressButtonTemplate.bind({})
LongPress.args = {
  children: 'long press - 2sec / tap',
}
