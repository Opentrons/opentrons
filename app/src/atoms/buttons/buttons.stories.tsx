import * as React from 'react'
import {
  Flex,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  SPACING,
  useLongPress,
  PrimaryButton,
} from '@opentrons/components'
import {
  TertiaryButton,
  QuaternaryButton,
  SubmitPrimaryButton,
  ToggleButton,
} from './index'
import { StyledText } from '../text'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/Buttons',
} as Meta

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

const QuaternaryButtonTemplate: Story<
  React.ComponentProps<typeof QuaternaryButton>
> = args => {
  const { children } = args
  return (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
      <QuaternaryButton>{children}</QuaternaryButton>
    </Flex>
  )
}

export const Quaternary = QuaternaryButtonTemplate.bind({})
Quaternary.args = {
  children: 'quaternary button',
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
