import * as React from 'react'

import {
  RobotCoordsForeignDiv,
  Text,
  LEGACY_COLORS,
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
        backgroundColor: COLORS.grey50,
        padding: SPACING.spacing4,
        height: '100%',
        color: COLORS.white,
        border: `1px solid ${COLORS.grey50}`,
      }}
    >
      <Text as="p" fontSize="0.5rem">
        {displayName}
      </Text>
    </RobotCoordsForeignDiv>
  )
}
