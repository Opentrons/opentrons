import * as React from 'react'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
} from '@opentrons/components'

interface Props {
  children?: JSX.Element
}

export function InProgressModal(props: Props): JSX.Element {
  const { children } = props

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      transform="translateY(75%)"
    >
      <Icon
        name="ot-spinner"
        size="5.1rem"
        color={COLORS.darkGreyEnabled}
        aria-label="spinner"
        spin
      />
      {children}
    </Flex>
  )
}
