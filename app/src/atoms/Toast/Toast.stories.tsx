import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
} from '@opentrons/components'
import { PrimaryButton } from '../buttons'
import { StyledText } from '../text'
import { Toast } from '.'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/Toast',
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
      {isShowToast && <Toast {...args} onClose={() => setIsShowToast(false)} />}
    </>
  )
}

export const Success = TemplateWithTimeout.bind({})
Success.args = {
  message: 'Success Toast message',
  type: 'success',
}

export const Warning = TemplateWithTimeout.bind({})
Warning.args = {
  message: 'Warning Toast message',
  type: 'warning',
}

export const Error = TemplateWithTimeout.bind({})
Error.args = {
  message: 'Error Toast message',
  type: 'error',
}

export const Info = TemplateWithTimeout.bind({})
Info.args = {
  message: 'Info Toast message',
  type: 'info',
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
      {isShowToast && <Toast {...args} />}
    </>
  )
}

export const SuccessWithoutTimeout = TemplateWithoutTimeout.bind({})
SuccessWithoutTimeout.args = {
  message: 'Success Toast message',
  type: 'success',
  disableTimeout: true,
}

export const WarningWithoutTimeout = TemplateWithoutTimeout.bind({})
WarningWithoutTimeout.args = {
  message: 'Warning Toast message',
  type: 'warning',
  disableTimeout: true,
}

export const ErrorWithoutTimeout = TemplateWithoutTimeout.bind({})
ErrorWithoutTimeout.args = {
  message: 'Error Toast message',
  type: 'error',
  disableTimeout: true,
}

export const InfoWithoutTimeout = TemplateWithoutTimeout.bind({})
InfoWithoutTimeout.args = {
  message: 'Info Toast message',
  type: 'info',
  disableTimeout: true,
}
