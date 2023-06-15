import * as React from 'react'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../atoms/text'
import { MediumButton } from '../atoms/buttons'

export function OnDeviceDisplayAppFallback(): JSX.Element {
  const handleRefreshClick = (): void => {
    console.log('clicked')
  }

  return (
    <Flex
      width="100%"
      height="100%"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing32}
      padding={SPACING.spacing40}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <StyledText as="h1" fontWeight={TYPOGRAPHY.fontWeightBold}>
        {'Something went wrong'}
      </StyledText>
      <MediumButton buttonText="Reload the app" onClick={handleRefreshClick} />
    </Flex>
  )
}
