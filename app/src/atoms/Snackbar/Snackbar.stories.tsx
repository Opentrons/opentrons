import * as React from 'react'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  PrimaryBtn,
  SPACING,
} from '@opentrons/components'
import { StyledText } from '../text'
import { Snackbar } from './index'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/Snackbar',
  component: Snackbar,
} as Meta

const DefaultTemplate: Story<React.ComponentProps<typeof Snackbar>> = args => {
  const [isShowSnackbar, setIsShowSnackbar] = React.useState<boolean>(false)

  const handleClick = (): void => {
    setIsShowSnackbar(true)
  }

  return (
    <>
      <Flex flexDirection={DIRECTION_ROW} marginY={SPACING.spacing4}>
        <PrimaryBtn onClick={handleClick}>Click me</PrimaryBtn>
        <Flex flexDirection={DIRECTION_COLUMN} marginLeft={SPACING.spacing3}>
          <StyledText as="p">
            When clicking the button, the Snackbar shows up in the bottom.
          </StyledText>
          <StyledText as="p">
            After 4 sec, the Snackbar will disappear
          </StyledText>
        </Flex>
      </Flex>
      {isShowSnackbar && (
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          width="100%"
          position="absolute"
          bottom={SPACING.spacingXXL}
          zIndex={1000}
        >
          <Snackbar {...args} onClose={() => setIsShowSnackbar(false)} />
        </Flex>
      )}
    </>
  )
}

export const QuickSnack = DefaultTemplate.bind({})
QuickSnack.args = {
  message: 'Short and sweet message',
}

const TenSecondTemplate: Story<
  React.ComponentProps<typeof Snackbar>
> = args => {
  const [isShowSnackbar, setIsShowSnackbar] = React.useState<boolean>(false)

  const handleClick = (): void => {
    setIsShowSnackbar(true)
  }

  return (
    <>
      <Flex flexDirection={DIRECTION_ROW} marginY={SPACING.spacing4}>
        <PrimaryBtn onClick={handleClick}>Click me</PrimaryBtn>
        <Flex flexDirection={DIRECTION_COLUMN} marginLeft={SPACING.spacing3}>
          <StyledText as="p">
            When clicking the button, the Snackbar shows up in the bottom.
          </StyledText>
          <StyledText as="p">
            After 10 sec, the Snackbar will disappear
          </StyledText>
        </Flex>
      </Flex>
      {isShowSnackbar && (
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          width="100%"
          position="absolute"
          bottom={SPACING.spacingXXL}
          zIndex={1000}
        >
          <Snackbar {...args} onClose={() => setIsShowSnackbar(false)} />
        </Flex>
      )}
    </>
  )
}

export const SubstantialSnack = TenSecondTemplate.bind({})
SubstantialSnack.args = {
  message:
    'A long complicated Snackbar message that we want to give them time to read',
  duration: 10000,
}
