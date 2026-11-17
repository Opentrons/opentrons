import * as React from 'react'

import {
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  PrimaryButton,
  SPACING,
  StyledText,
  useLongPress,
} from '@opentrons/components'

import type { Meta, Story } from '@storybook/react'
import type { ComponentProps } from 'react'

export default {
  title: 'App/Atoms/Buttons/LongPressButton',
} as Meta

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
