import * as React from 'react'
import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  PrimaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { Toast } from './index'
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
      <Flex flexDirection={DIRECTION_ROW} marginY={SPACING.spacing16}>
        <PrimaryButton onClick={handleClick}>Click me</PrimaryButton>
        <Flex flexDirection={DIRECTION_COLUMN} marginLeft={SPACING.spacing8}>
          <StyledText as="p">
            When clicking the button, the Toast shows up below.
          </StyledText>
          <StyledText as="p">
            Unless you set a duration or disable the timeout, the Toast will
            disappear between 2 and 7 seconds depending on the length of the
            text.
          </StyledText>
        </Flex>
      </Flex>
      {isShowToast && <Toast {...args} onClose={() => setIsShowToast(false)} />}
    </>
  )
}

export const ToastComponent = TemplateWithTimeout.bind({})
ToastComponent.args = {
  message: 'Success Toast message',
  type: 'success',
  displayType: 'desktop',
}
