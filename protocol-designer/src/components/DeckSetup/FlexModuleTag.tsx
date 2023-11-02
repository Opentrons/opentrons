import * as React from 'react'

import {
  RobotCoordsForeignDiv,
  Text,
  COLORS,
  SPACING,
} from '@opentrons/components'
import type { ModuleDefinition } from '@opentrons/shared-data'

interface FlexModuleTagProps {
  dimensions: ModuleDefinition['dimensions']
  displayName: string
}

export function FlexModuleTag(props: FlexModuleTagProps): JSX.Element {
  const { dimensions, displayName } = props
  return (
    <RobotCoordsForeignDiv
      width={dimensions.labwareInterfaceXDimension}
      height={16}
      y={-22}
      innerDivProps={{
        backgroundColor: COLORS.darkGreyEnabled,
        padding: SPACING.spacing4,
        height: '100%',
        color: COLORS.white,
        border: `1px solid ${COLORS.darkGrey}`,
      }}
    >
      <Text as="p" fontSize="0.5rem">
        {displayName}
      </Text>
    </RobotCoordsForeignDiv>
  )
}
