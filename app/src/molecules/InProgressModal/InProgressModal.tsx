import * as React from 'react'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
} from '@opentrons/components'

interface Props {
  //  optional override of the spinner
  alternativeSpinner?: React.ReactNode
  children?: JSX.Element
}

export function InProgressModal(props: Props): JSX.Element {
  const { alternativeSpinner, children } = props

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_COLUMN}
      marginY="8rem"
    >
      {alternativeSpinner ?? (
        <Icon
          name="ot-spinner"
          size="5.125rem"
          color={COLORS.darkGreyEnabled}
          aria-label="spinner"
          spin
        />
      )}
      {children}
    </Flex>
  )
}
