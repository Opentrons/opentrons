import * as React from 'react'

import {
  Flex,
  LegacyStyledText,
  PrimaryButton,
  VIEWPORT,
} from '@opentrons/components'

import { BackgroundOverlay } from './index'

import type { Meta, Story } from '@storybook/react'

export default {
  title: 'ODD/Molecules/BackgroundOverlay',
  ...VIEWPORT.touchScreenViewport,
} as Meta

const Template: Story<
  React.ComponentProps<typeof BackgroundOverlay>
> = args => {
  const [openOverlay, setOpenOverlay] = React.useState<boolean>(false)
  return (
    <Flex>
      {openOverlay ? (
        <Flex height="80%" width="80%">
          <BackgroundOverlay
            onClick={() => {
              setOpenOverlay(false)
            }}
          />
        </Flex>
      ) : (
        <PrimaryButton
          onClick={() => {
            setOpenOverlay(true)
          }}
        >
          <LegacyStyledText as="h4">
            Click to open the Background Overlay
          </LegacyStyledText>
        </PrimaryButton>
      )}
    </Flex>
  )
}
export const Default = Template.bind({})
