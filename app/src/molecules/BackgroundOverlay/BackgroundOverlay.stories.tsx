import * as React from 'react'
import { Flex, PrimaryButton } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { BackgroundOverlay } from './index'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Molecules/BackgroundOverlay',
} as Meta

const Template: Story<
  React.ComponentProps<typeof BackgroundOverlay>
> = args => {
  const [openOverlay, setOpenOverlay] = React.useState<boolean>(false)
  return (
    <Flex>
      {openOverlay ? (
        <Flex height="80%" width="80%">
          <BackgroundOverlay onClick={() => setOpenOverlay(false)} />
        </Flex>
      ) : (
        <PrimaryButton onClick={() => setOpenOverlay(true)}>
          <StyledText as="h4">Click to open the Background Overlay</StyledText>
        </PrimaryButton>
      )}
    </Flex>
  )
}
export const Default = Template.bind({})
