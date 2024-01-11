import * as React from 'react'

import {
  RobotCoordsForeignDiv,
  Text,
  LEGACY_COLORS,
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
      height={20}
      y={-22}
      innerDivProps={{
        backgroundColor: LEGACY_COLORS.darkGreyEnabled,
        padding: SPACING.spacing4,
        height: '100%',
        color: COLORS.white,
        border: `1px solid ${LEGACY_COLORS.darkGrey}`,
      }}
    >
      <Text as="p" fontSize="0.5rem">
        {displayName}
      </Text>
    </RobotCoordsForeignDiv>
  )
}
