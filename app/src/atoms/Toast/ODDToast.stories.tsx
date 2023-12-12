import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
  POSITION_FIXED,
  PrimaryButton,
  SPACING,
} from '@opentrons/components'
import { touchScreenViewport } from '../../DesignTokens/constants'
import { StyledText } from '../text'
import { Toast } from '.'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/Toast',
  component: Toast,
  parameters: touchScreenViewport,
} as Meta

const Template: Story<React.ComponentProps<typeof Toast>> = args => {
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
            When clicking the button, the Toast shows up in the bottom.
          </StyledText>
          <StyledText as="p">
            Unless you set a duration or disable the timeout, the Toast will
            disappear between 2 and 7 seconds depending on the length of the
            text.
          </StyledText>
        </Flex>
      </Flex>
      {isShowToast && (
        <Flex
          justifyContent={JUSTIFY_CENTER}
          position={POSITION_FIXED}
          bottom={SPACING.spacing16}
          zIndex={1000}
        >
          <Toast {...args} onClose={() => setIsShowToast(false)} />
        </Flex>
      )}
    </>
  )
}

export const ToastComponent = Template.bind({})
ToastComponent.args = {
  message: 'Success Toast message',
  type: 'success',
  displayType: 'odd',
}
