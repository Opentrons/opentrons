import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
} from '@opentrons/components'
import { getIsShellReady } from '../../redux/shell'

export function InitialLoadingScreen({
  children,
}: {
  children?: React.ReactNode
}): JSX.Element {
  const isShellReady = useSelector(getIsShellReady)

  return isShellReady ? (
    <>{children}</>
  ) : (
    <Flex
      backgroundColor={COLORS.grey35}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing40}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      height="100%"
    >
      <Icon
        name="ot-spinner"
        size="160px"
        spin
        color={COLORS.grey60}
        aria-label="loading indicator"
      />
    </Flex>
  )
}
