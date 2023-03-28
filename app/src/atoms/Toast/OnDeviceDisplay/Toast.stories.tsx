import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
  POSITION_FIXED,
  SPACING,
} from '@opentrons/components'
import { PrimaryButton } from '../../buttons'
import { StyledText } from '../../text'
import { Toast } from './Toast'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/Toast',
  component: Toast,
} as Meta

const TemplateWithTimeout: Story<React.ComponentProps<typeof Toast>> = args => {
  const [isShowToast, setIsShowToast] = React.useState<boolean>(false)

  const handleClick = (): void => {
    setIsShowToast(true)
  }

  return (
    <>
      <Flex flexDirection={DIRECTION_ROW} marginY={SPACING.spacing4}>
        <PrimaryButton onClick={handleClick}>Click me</PrimaryButton>
        <Flex flexDirection={DIRECTION_COLUMN} marginLeft={SPACING.spacing3}>
          <StyledText as="p">
            When clicking the button, the Toast shows up in the bottom.
          </StyledText>
          <StyledText as="p">After 5 sec, the Toast will disappear</StyledText>
        </Flex>
      </Flex>
      {isShowToast && (
        <Flex
          justifyContent={JUSTIFY_CENTER}
          position={POSITION_FIXED}
          bottom={SPACING.spacing4}
          zIndex={1000}
        >
          <Toast {...args} onClose={() => setIsShowToast(false)} />
        </Flex>
      )}
    </>
  )
}

export const Success = TemplateWithTimeout.bind({})
Success.args = {
  message: 'Success Toast message',
  type: 'success',
}

export const SuccessWithSecondaryMessageAndCloseButton = TemplateWithTimeout.bind(
  {}
)
SuccessWithSecondaryMessageAndCloseButton.args = {
  closeButton: 'Button text',
  message: 'Toast message',
  secondaryMessage: 'Optional secondary',
  type: 'success',
}

export const Warning = TemplateWithTimeout.bind({})
Warning.args = {
  message: 'Alert Toast message',
  type: 'alert',
}

const TemplateWithoutTimeout: Story<
  React.ComponentProps<typeof Toast>
> = args => {
  const [isShowToast, setIsShowToast] = React.useState<boolean>(false)

  const handleClick = (): void => {
    setIsShowToast(currentIsShowToast => !currentIsShowToast)
  }

  return (
    <>
      <Flex flexDirection={DIRECTION_ROW} marginY={SPACING.spacing4}>
        <PrimaryButton onClick={handleClick}>Click me</PrimaryButton>
        <Flex flexDirection={DIRECTION_COLUMN} marginLeft={SPACING.spacing3}>
          <StyledText as="p">
            When clicking the button, the Toast shows up in the bottom.
          </StyledText>
          <StyledText as="p">
            When clicking the button again, the Toast will disappear
          </StyledText>
        </Flex>
      </Flex>
      {isShowToast && (
        <Flex
          justifyContent={JUSTIFY_CENTER}
          position={POSITION_FIXED}
          bottom={SPACING.spacing4}
          zIndex={1000}
        >
          <Toast {...args} />
        </Flex>
      )}
    </>
  )
}

export const SuccessWithoutTimeout = TemplateWithoutTimeout.bind({})
SuccessWithoutTimeout.args = {
  message: 'Success Toast message',
  type: 'success',
  disableTimeout: true,
}

export const SuccessWithSecondaryMessageAndCloseButtonWithoutTimeout = TemplateWithTimeout.bind(
  {}
)
SuccessWithSecondaryMessageAndCloseButtonWithoutTimeout.args = {
  closeButton: 'Button text',
  message: 'Toast message',
  secondaryMessage: 'Optional secondary',
  type: 'success',
  disableTimeout: true,
}

export const WarningWithoutTimeout = TemplateWithoutTimeout.bind({})
WarningWithoutTimeout.args = {
  message: 'Alert Toast message',
  type: 'alert',
  disableTimeout: true,
}

export const SuperLongSecondaryAndCloseButtonWithoutTimeout = TemplateWithTimeout.bind(
  {}
)
SuperLongSecondaryAndCloseButtonWithoutTimeout.args = {
  closeButton: 'Close',
  message: 'Successfully received',
  secondaryMessage: 'Super-long-protocol-file-name-that-the-user-made.py',
  type: 'success',
  disableTimeout: true,
}
